// Copyright 2014 YDN Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


/**
 * @fileoverview Context container attached to right side of email message.
 *
 * @author kyawtun@yathit.com (Kyaw Tun)
 */


goog.provide('ydn.crm.inj.ContextContainer');
goog.require('goog.Disposable');
goog.require('ydn.crm.gmail.ComposeObserver');
goog.require('ydn.crm.gmail.GmailObserver');
goog.require('ydn.crm.ui.AppStatusBar');
goog.require('ydn.crm.ui.StatusBar');



/**
 * Context container.
 * @param {ydn.crm.gmail.GmailObserver} gmail_observer
 * @param {Element=} opt_root_ele
 * @constructor
 * @struct
 */
ydn.crm.inj.ContextContainer = function(gmail_observer, opt_root_ele) {
  this.ele_root = opt_root_ele || this.createDom();

  /**
   * @type {boolean}
   * @private
   */
  this.has_attached_ = false;
  goog.style.setElementShown(this.ele_root, false);
  goog.events.listen(gmail_observer, ydn.crm.gmail.GmailObserver.EventType.CONTEXT_CHANGE,
      this.onGmailContextEvent_, false, this);
  goog.events.listen(gmail_observer, ydn.crm.gmail.GmailObserver.EventType.PAGE_CHANGE,
      this.onGmailPageChanged, false, this);
};


/**
 * @define {boolean} debug flag.
 */
ydn.crm.inj.ContextContainer.DEBUG = false;


/**
 * @protected
 * @type {goog.debug.Logger}
 */
ydn.crm.inj.ContextContainer.prototype.logger = goog.log.getLogger('ydn.crm.inj.ContextContainer');


/**
 * @const
 * @type {string}
 */
ydn.crm.inj.ContextContainer.ID_ROOT_ELE = 'root-panel';


/**
 * @const
 * @type {string}
 */
ydn.crm.inj.ContextContainer.CSS_CLASS_STICKY_RIGHT = 'sticky-right';


/**
 * @const
 * @type {string} class name for this app.
 */
ydn.crm.inj.ContextContainer.CSS_CLASS = 'inj';


/**
 * @const
 * @type {string} class name for this app.
 */
ydn.crm.inj.ContextContainer.CSS_CLASS_CONTAINER = 'container';


/**
 * @return {Element}
 */
ydn.crm.inj.ContextContainer.prototype.createDom = function() {
  /**
   * Root element.
   * @type {Element}
   * @protected
   */
  var ele_root = document.createElement('div');
  ele_root.id = ydn.crm.inj.ContextContainer.ID_ROOT_ELE;
  ele_root.className = ydn.crm.inj.ContextContainer.CSS_CLASS + ' ' + ydn.crm.ui.CSS_CLASS;
  // temporarily attached to document.
  document.body.appendChild(ele_root);
  goog.style.setElementShown(ele_root, false);
  var container = document.createElement('div');
  container.className = ydn.crm.inj.ContextContainer.CSS_CLASS_CONTAINER;
  ele_root.appendChild(container);
  for (var i = 0; i < 3; i++) {
    var ele = document.createElement('div');
    container.appendChild(ele);
  }

  // header
  var header = document.createElement('div');
  var a = document.createElement('a');
  a.textContent = 'Setup';
  a.href = chrome.extension.getURL(ydn.crm.base.SETUP_PAGE);
  a.className = 'setup-link';
  header.appendChild(a);
  ele_root.firstElementChild.appendChild(header);
  goog.style.setElementShown(header, false);

  return ele_root;
};


/**
 * Set user info.
 * @param {ydn.crm.ui.UserSetting} user
 * @deprecated no longer using.
 */
ydn.crm.inj.ContextContainer.prototype.setUserSetting = function(user) {
  var header = this.getHeaderElement();
  if (user && user.hasValidLogin()) {
    goog.style.setElementShown(header, false);
  } else {
    // show header link to login.
    goog.style.setElementShown(header, true);
  }
};


/**
 * @return {Element}
 */
ydn.crm.inj.ContextContainer.prototype.getElement = function() {
  return this.ele_root;
};


/**
 * @return {Element}
 */
ydn.crm.inj.ContextContainer.prototype.getHeaderElement = function() {
  return this.ele_root.firstElementChild.children[0];
};


/**
 * @return {Element}
 */
ydn.crm.inj.ContextContainer.prototype.getContentElement = function() {
  return this.ele_root.firstElementChild.children[1];
};


/**
 * @return {Element}
 */
ydn.crm.inj.ContextContainer.prototype.getFooterElement = function() {
  return this.ele_root.firstElementChild.children[2];
};


/**
 * Attach the root panel to relevant location.
 */
ydn.crm.inj.ContextContainer.prototype.attach = function() {
  // it is OK to call render repeatedly.
  this.has_attached_ = true;
};


/**
 * Detach.
 */
ydn.crm.inj.ContextContainer.prototype.detach = function() {
  this.has_attached_ = false;
};


/**
 * Attach to Gmail right side bar.
 * @param {HTMLTableElement} contact_table right bar table
 */
ydn.crm.inj.ContextContainer.prototype.attachToGmailRightBar = function(contact_table) {

};


/**
 * @param {ydn.crm.gmail.GmailObserver.PageChangeEvent} e
 */
ydn.crm.inj.ContextContainer.prototype.onGmailPageChanged = function(e) {
  // remove previous attachment
  this.attachToGmailRightBar(null);
};


/**
 * Sniff contact and set to model.
 * @param {ydn.crm.gmail.GmailObserver.ContextRightBarEvent} e
 * @private
 */
ydn.crm.inj.ContextContainer.prototype.onGmailContextEvent_ = function(e) {

  this.attachToGmailRightBar(e.table);

};


/**
 * @return {boolean}
 */
ydn.crm.inj.ContextContainer.prototype.isAttached = function() {
  return this.has_attached_;
};
