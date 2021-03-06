// Copyright 2014 YDN Authors. All Rights Reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.


/**
 * @fileoverview Twitter widget.
 *
 * @author kyawtun@yathit.com (Kyaw Tun)
 */


goog.provide('ydn.social.ui.Twitter');
goog.require('goog.date.relative');
goog.require('ydn.social.ui.FixMetaProfile');
goog.require('ydn.time');



/**
 * Twitter widget.
 * @param {goog.dom.DomHelper=} opt_dom
 * @constructor
 * @struct
 * @extends {ydn.social.ui.FixMetaProfile}
 */
ydn.social.ui.Twitter = function(opt_dom) {
  goog.base(this, ydn.social.Network.TWITTER, opt_dom);

};
goog.inherits(ydn.social.ui.Twitter, ydn.social.ui.FixMetaProfile);


/**
 * @inheritDoc
 */
ydn.social.ui.Twitter.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  var hd = this.getHandler();
  var button = this.getButton();
  hd.listen(button, 'click', this.onButtonClicked_);
};


/**
 * Render twitter profile
 * @param {Element} el element to render on.
 * @param {Object} profile twitter profile record as return by: users/show API
 */
ydn.social.ui.Twitter.renderProfileDetail = function(el, profile) {
  if (ydn.social.ui.MetaProfile.DEBUG) {
    window.console.log(profile);
  }
  var tid = 'template-detail-' + ydn.social.Network.TWITTER;
  var t = ydn.ui.getTemplateById(tid).content;
  el.innerHTML = '';
  el.appendChild(t.cloneNode(true));
  goog.style.setElementShown(el, true);
  var header = el.querySelector('.header');
  var name = header.querySelector('.name a');
  name.textContent = '@' + profile['screen_name'];
  name.href = profile['url'];
  header.querySelector('.description').textContent = profile['description'] || '';
  header.querySelector('.logo img').src = profile['profile_image_url_https'];
  header.querySelector('.followers').textContent = profile['followers_count'];
  header.querySelector('.following').textContent = profile['friends_count'];
  if (profile['location'] && profile['location'] != 'Global') {
    header.querySelector('.location').textContent = profile['location'];
  } else {
    goog.style.setElementShown(header.querySelector('.location'), false);
  }
};


/**
 * Render twitter profile
 * @param {Element} detail element to render on.
 * @param {Array<Object>} tweets list of tweets as return by:
 * statuses/user_timeline API
 */
ydn.social.ui.Twitter.renderTweet = function(detail, tweets) {
  if (ydn.social.ui.MetaProfile.DEBUG) {
    window.console.log(tweets);
  }
  detail.innerHTML = '';

  var templ = ydn.ui.getTemplateById('template-tweet').content;
  for (var i = 0; i < tweets.length; i++) {
    var tweet = tweets[i];
    var li = templ.cloneNode(true);
    li.querySelector('.text').textContent = tweet['text'];
    if (tweet['location'] && tweet['location'] != 'Global') {
      li.querySelector('.location').textContent = tweet['location'];
    }
    var date = new Date(tweet['created_at']);
    var created = date.getTime();
    if (created > 0) {
      li.querySelector('.time').textContent =
          goog.date.relative.format(created) || date.toDateString();
    }

    detail.appendChild(li);
  }
};


/**
 * @private
 * @return {!goog.async.Deferred<Object>}
 */
ydn.social.ui.Twitter.prototype.refreshTweet_ = function() {
  var container = this.getContainer();
  var tweets_ul = container.querySelector('.tweets');
  if (!tweets_ul) {
    return goog.async.Deferred.succeed(null);
  }
  container.classList.add('working');
  var model = this.getModel();
  var profile = model.getProfile();
  return profile.fetchFeed().addCallbacks(function(tweets) {
    if (ydn.social.ui.MetaProfile.DEBUG) {
      window.console.log(tweets);
    }
    container.classList.remove('working');
    if (!tweets) {
      return;
    }
    container.classList.add('exist');
    ydn.social.ui.Twitter.renderTweet(tweets_ul, tweets);
  }, function(e) {
    container.classList.remove('working');
    if (e && e.name == ydn.crm.base.ErrorName.HOST_PERMISSION) {
      container.classList.add('alert');
      this.getButton().setAttribute('title', 'Click to grant access to Twitter API');
    } else {
      container.classList.add('error');
      ydn.crm.msg.Manager.addStatus('Fetching twitter fail: ' + String(e));
    }
  }, this);
};


/**
 * @private
 * @return {!goog.async.Deferred<Object>}
 */
ydn.social.ui.Twitter.prototype.refreshProfileDetail_ = function() {
  var container = this.getContainer();
  var model = this.getModel();
  if (!model) {
    return goog.async.Deferred.fail(null);
  }
  container.classList.add('working');
  var profile = model.getProfile();
  return profile.fetchDetail()
      .addCallbacks(function(dp) {
        if (ydn.social.ui.MetaProfile.DEBUG) {
          window.console.log(dp);
        }
        container.classList.remove('working');
        if (!dp) {
          return;
        }
        container.classList.add('exist');
        ydn.social.ui.Twitter.renderProfileDetail(this.getDetailElement(), dp);
      }, function(e) {
        goog.style.setElementShown(this.getDetailElement(), false);
        container.classList.remove('working');
        if (e && e.name == ydn.crm.base.ErrorName.HOST_PERMISSION) {
          container.classList.add('alert');
        } else {
          container.classList.add('error');
          ydn.crm.msg.Manager.addStatus('Fetching twitter fail: ' + String(e));
        }
      }, this);
};


/**
 * @private
 */
ydn.social.ui.Twitter.prototype.refresh_ = function() {
  this.refreshProfileDetail_().addCallback(function() {
    this.refreshTweet_();
  }, this);
};


/**
 * @override
 */
ydn.social.ui.Twitter.prototype.redraw = function() {
  goog.base(this, 'redraw');
  var model = this.getModel();
  if (model && model.hasProfile()) {
    this.refresh_();
  }
};


/**
 * @param {goog.events.BrowserEvent} ev
 * @private
 */
ydn.social.ui.Twitter.prototype.onButtonClicked_ = function(ev) {
  this.refresh_();
};
