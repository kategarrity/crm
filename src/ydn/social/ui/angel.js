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
 * @fileoverview AngleList widget.
 *
 * @author kyawtun@yathit.com (Kyaw Tun)
 */


goog.provide('ydn.social.ui.AngelList');
goog.require('goog.date.relative');
goog.require('ydn.social.ui.FixMetaProfile');
goog.require('ydn.time');



/**
 * AngleList widget.
 * @param {goog.dom.DomHelper=} opt_dom
 * @constructor
 * @struct
 * @extends {ydn.social.ui.FixMetaProfile}
 */
ydn.social.ui.AngelList = function(opt_dom) {
  goog.base(this, ydn.social.Network.ANGLE_LIST, opt_dom);

};
goog.inherits(ydn.social.ui.AngelList, ydn.social.ui.FixMetaProfile);


/**
 * @inheritDoc
 */
ydn.social.ui.AngelList.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  var hd = this.getHandler();
  var button = this.getButton();
  hd.listen(button, 'click', this.onButtonClicked_);
};


/**
 * @param {ydn.social.Profile} profile
 * @private
 */
ydn.social.ui.AngelList.prototype.refreshByFC_ = function(profile) {
  var tid = 'template-detail-' + ydn.social.Network.TWITTER;
  var t = ydn.ui.getTemplateById(tid).content;
  var el = this.getDetailElement();
  el.innerHTML = '';
  el.appendChild(t.cloneNode(true));
  goog.style.setElementShown(el, true);
  var header = el.querySelector('.header');
  var name = header.querySelector('.name a');
  name.textContent = profile.getScreenName();
  var url = profile.getProfileUrl();
  if (url) {
    name.href = url;
  } else {
    name.removeAttribute('href');
  }
  var photo = profile.getPhotoUrl();
  var img = header.querySelector('.logo img');
  if (photo) {
    img.src = photo;
  } else {
    img.removeAttribute('src');
  }
  header.querySelector('.description').textContent = profile.getBio() || '';
  header.querySelector('.followers').textContent = profile.getFollowers() || '';
  header.querySelector('.following').textContent = profile.getFollowing() || '';
};


/**
 * @override
 */
ydn.social.ui.AngelList.prototype.redraw = function() {
  var container = this.getContainer();
  this.resetBaseClass();
  this.getButton().setAttribute('title', 'AngelList');
  var detail = this.getDetailElement();
  detail.innerHTML = '';

  var model = this.getModel();
  var profile = model ? model.getProfile() : null;
  if (profile) {
    goog.style.setElementShown(container, true);
    container.classList.add('exist');
    goog.style.setElementShown(detail, true);
    this.refreshByFC_(profile);
    this.fetchDetailAndRefresh_();
  } else {
    goog.style.setElementShown(container, false);
    goog.style.setElementShown(detail, false);
    container.classList.add('empty');
  }
};


/**
 * @param {Element} el
 * @param {Array} places
 * @private
 */
ydn.social.ui.AngelList.renderPlaceLived_ = function(el, places) {
  if (!places) {
    return;
  }
  var place = [];
  for (var i = 0; i < places.length; i++) {
    if (places[i]['value']) {
      place.push(places[i]['value']);
    }
  }
  el.textContent = place.join(', ');
};


/**
 * @param {Element} el
 * @param {Array} roles
 * @private
 */
ydn.social.ui.AngelList.renderRoles_ = function(el, roles) {
  if (!roles) {
    return;
  }
  var txt = roles.map(function(x) {
    return x['display_name'];
  });
  el.textContent = txt.join(', ');
};


/**
 * Render Google plus profile
 * @param {Element} el element to render on.
 * @param {Object} profile twitter profile record as return by: people/get API
 */
ydn.social.ui.AngelList.renderAngelProfile = function(el, profile) {
  if (ydn.social.ui.MetaProfile.DEBUG) {
    window.console.log(profile);
  }
  var tid = 'template-detail-' + ydn.social.Network.ANGLE_LIST;
  var t = ydn.ui.getTemplateById(tid).content;
  el.innerHTML = '';
  el.appendChild(t.cloneNode(true));
  goog.style.setElementShown(el, true);
  var header = el.querySelector('.header');
  var name = header.querySelector('.name a');
  name.textContent = profile['name'];
  name.href = profile['angellist_url'];
  header.querySelector('.description').textContent = profile['bio'] || '';
  header.querySelector('.followers').textContent = profile['follower_count'];
  ydn.social.ui.AngelList.renderPlaceLived_(header.querySelector('.location'),
      profile['locations']);
  ydn.social.ui.AngelList.renderRoles_(header.querySelector('.roles'),
      profile['roles']);
};


/**
 * @private
 */
ydn.social.ui.AngelList.prototype.fetchDetailAndRefresh_ = function() {
  var model = this.getModel();
  if (!model) {
    return;
  }
  var container = this.getContainer();
  var detail = this.getDetailElement();
  container.classList.add('working');
  container.classList.remove('exist');
  model.getProfile().fetchDetail()
      .addCallbacks(function(dp) {
        if (ydn.social.ui.MetaProfile.DEBUG) {
          window.console.log(dp);
        }
        container.classList.remove('working');
        if (!dp) {
          return;
        }
        container.classList.add('exist');
        ydn.social.ui.AngelList.renderAngelProfile(detail, dp);
      }, function(e) {
        goog.style.setElementShown(detail, false);
        container.classList.remove('working');
        if (e.name == ydn.crm.base.ErrorName.HOST_PERMISSION) {
          container.classList.add('alert');
          this.getButton().setAttribute('title', 'Click to grant access to ' +
              'AngelList API');
        } else {
          ydn.crm.msg.Manager.addStatus('Fetching AngelList fail: ' + String(e));
          container.classList.add('error');
        }
      }, this);
};


/**
 * @param {goog.events.BrowserEvent} ev
 * @private
 */
ydn.social.ui.AngelList.prototype.onButtonClicked_ = function(ev) {
  this.fetchDetailAndRefresh_();
};
