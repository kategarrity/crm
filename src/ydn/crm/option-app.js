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
 * @fileoverview Option page app for CRMinInbox suite.
 *
 * All extensions in CRMinInbox suite use this generic app page, and hence
 * same functionality. However each extension use different default
 * configuration for the target application.
 */



goog.provide('ydn.crm.OptionPageApp');
goog.require('ydn.crm.AboutPage');
goog.require('ydn.crm.msg.Manager');
goog.require('ydn.crm.msg.StatusBar');
goog.require('ydn.crm.sugarcrm.Page');
goog.require('ydn.crm.tracking.MsgModel');
goog.require('ydn.crm.tracking.Panel');
goog.require('ydn.msg.Pipe');



/**
 * Option page app for CRMinInbox suite.
 * @constructor
 * @struct
 */
ydn.crm.OptionPageApp = function() {

  ydn.msg.initPipe(ydn.msg.ChannelName.OPTIONS);
  ydn.ui.setTemplateDocument(chrome.extension.getURL(ydn.crm.base.INJ_TEMPLATE));

  /**
   * @protected
   * @type {Object}
   */
  this.user_info = null;

  /**
   * @type {Object.<ydn.crm.IPage>}
   * @private
   */
  this.pages_ = {};

  var status_el = document.getElementById(ydn.crm.ui.SugarListPanel.CSS_CLASS_STATUS);
  var status = new ydn.crm.msg.StatusBar(true);
  status.render(status_el);
  ydn.crm.msg.Manager.addConsumer(status);

  /**
   * Process user page setup.
   * @type {boolean}
   * @private
   */
  this.process_user_page_setup_ = false;

};


/**
 * @define {boolean} debug flag.
 */
ydn.crm.OptionPageApp.DEBUG = false;


/**
 * Add page.
 * @param {string} name
 * @param {string} label
 * @param {ydn.crm.IPage} page
 */
ydn.crm.OptionPageApp.prototype.addPage = function(name, label, page) {
  this.pages_[name] = page;
  var main_menu = document.getElementById('main-menu');
  var content = document.getElementById('app-content');
  var li = document.createElement('li');
  if (main_menu.childElementCount == 0) {
    li.setAttribute('selected', '');
  }
  var a = document.createElement('a');
  a.href = '#' + name;
  a.textContent = label;
  li.appendChild(a);
  main_menu.appendChild(li);

  var div = document.createElement('div');
  div.setAttribute('name', name);
  div.style.display = 'none';
  content.appendChild(div);
  page.render(div);
};


/**
 * Update user info.
 * @param {YdnApiUser} user_info
 * @private
 */
ydn.crm.OptionPageApp.prototype.updateUserInfo_ = function(user_info) {
  if (user_info) {
    var btn_login = document.getElementById('user-login');
    var ele_name = document.getElementById('user-name');
    var main_menu = document.getElementById('main-menu');
    var content = document.getElementById('app-content');
    if (user_info.is_login) {
      btn_login.href = user_info.logout_url;
      btn_login.textContent = 'logout';
      ele_name.textContent = user_info.email;
      main_menu.style.display = '';
      content.style.display = '';
    } else {
      var url = user_info.login_url;
      if (ydn.crm.OptionPageApp.DEBUG && url.charAt(0) == '/') {
        // Local dev server need convert relative to full url.
        url = 'http://127.0.0.1:8080' + url;
      }
      btn_login.href = url;
      btn_login.textContent = 'login';
      btn_login.style.display = '';
      ele_name.textContent = '';
      main_menu.style.display = 'none';
      content.style.display = 'none';
    }
  }
};


/**
 * Process after login.
 * @param {ydn.crm.DashboardProfile} profile user profile for pages.
 * @protected
 */
ydn.crm.OptionPageApp.prototype.processUserPageSetup = function(profile) {
  for (var i = 0; i < profile.pages.length; i++) {
    var pn = profile.pages[i];
    var name = i == 0 ? 'home' : pn;
    if (pn == 'tracking') {
      var model = new ydn.crm.tracking.MsgModel();
      var page = new ydn.crm.tracking.Panel(model);
      this.addPage(name, page.toString(), page);
    } else if (pn == 'about-sugarcrm') {
      var about = new ydn.crm.AboutPage('about-template');
      this.addPage(name, about.toString(), about);
    } else if (pn == 'about-tracking') {
      var about_tk = new ydn.crm.AboutPage('tracking-about-template');
      this.addPage(name, about_tk.toString(), about_tk);
    } else if (pn == 'sugarcrm') {
      var sugar = new ydn.crm.sugarcrm.Page();
      this.addPage(name, sugar.toString(), sugar);
    } else {
      window.console.error('Invalid page name: ' + pn);
    }
  }

};


/**
 * Do silence login.
 * @protected
 * @param {Object?} context login context
 * @return {!goog.async.Deferred}
 */
ydn.crm.OptionPageApp.prototype.login = function(context) {

  return ydn.msg.getChannel().send('echo').addCallbacks(function(ok) {
    this.setStatus('logging in...');
    var user = ydn.crm.ui.UserSetting.getInstance();
    return user.onReady().addCallbacks(function() {
      var user_info = user.getUserInfo();
      goog.Timer.callOnce(function() {
        if (ydn.crm.OptionPageApp.DEBUG) {
          window.console.log('user ready', user_info);
        }
        this.updateUserInfo_(user_info);

        var content = document.getElementById('app-content');
        if (user_info.is_login) {
          content.style.display = '';
        } else {
          content.style.display = 'none';
          this.setStatus('Not login');
        }
      }, 10, this);
      return user_info;
    }, function(e) {
      var msg = e.message ? e.message : e;
      this.setStatus('Error: ' + msg);
    }, this);
  }, function(e) {
    // btn_login.href = '?' + Math.random(); // refresh the page
    // btn_login.textContent = 'refresh';
    var msg = e instanceof Error ? e.name + ' ' + e.message : e;
    this.setStatus('Failed to connect to background page: ' + msg);
  }, this);
};


/**
 * Show a particular section.
 * @param {string} name
 * @private
 */
ydn.crm.OptionPageApp.prototype.showPanel_ = function(name) {
  name = name || 'home';
  name = name.trim().toLowerCase();
  var menu = document.getElementById('main-menu');
  var content = document.getElementById('app-content');
  var has_selected = false;
  var selected_index = -1;
  for (var i = content.childElementCount - 1; i >= 0; i--) {
    var page_name = content.children[i].getAttribute('name');
    if (page_name == name) {
      selected_index = i;
      break;
    }
  }
  if (selected_index == -1) {
    ydn.crm.msg.Manager.addStatus('Invalid tab name: ' + name);
    return;
  }
  for (var i = content.childElementCount - 1; i >= 0; i--) {
    var page = content.children[i];
    var page_name = page.getAttribute('name');
    var selected = selected_index == i;
    if (selected) {
      this.pages_[name].onPageShow();
    }

    menu.children[i].className = selected ? 'selected' : '';
    page.style.display = selected ? '' : 'none';
  }
};


/**
 * @param {string} msg
 */
ydn.crm.OptionPageApp.prototype.setStatus = function(msg) {
  ydn.crm.msg.Manager.addStatus(msg);
};


/**
 * Run the app.
 */
ydn.crm.OptionPageApp.prototype.run = function() {
  var me = this;
  var menu = document.getElementById('main-menu');
  window.addEventListener('popstate', function(e) {
    if (ydn.crm.OptionPageApp.DEBUG) {
      window.console.log('popstate ' + location.hash);
    }
    me.showPanel_(location.hash.replace('#', ''));
  }, false);

  var link = document.getElementById('user-login');
  link.addEventListener('click', function(e) {
    e.preventDefault();
    if (link.textContent == 'logout') {
      ydn.msg.getChannel().send('logged-out');
    }

    ydn.ui.openPageAsDialog(e);
  }, true);

  chrome.runtime.onMessageExternal.addListener(
      function(request, sender, sendResponse) {
        if (request == 'closing') {
          sendResponse('close');
          location.reload();
        }
      });

  this.login(null).addCallback(function() {
    if (this.process_user_page_setup_) {
      ydn.msg.getChannel().send(ydn.crm.Ch.Req.USER_DASHBOARD).addCallback(function(obj) {
        goog.Timer.callOnce(function() {
          this.processUserPageSetup(/** @type {ydn.crm.DashboardProfile} */ (obj));
          this.showPanel_(location.hash.replace('#', ''));
        }, 10, this);
      }, this);
    } else {
      goog.Timer.callOnce(function() {
        this.showPanel_(location.hash.replace('#', ''));
      }, 10, this);
    }
  }, this);
};


/**
 * Run option page app.
 * @return {ydn.crm.OptionPageApp}
 */
ydn.crm.OptionPageApp.runOptionApp = function() {
  var app = new ydn.crm.OptionPageApp();
  app.process_user_page_setup_ = true;
  app.run();
  return app;
};