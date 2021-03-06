/**
 * @fileoverview Control HUB stick to right side.
 *
 */


goog.provide('ydn.crm.inj.Hud');
goog.require('goog.events');
goog.require('ydn.crm.msg.Manager');
goog.require('ydn.crm.msg.StatusBar');
goog.require('ydn.crm.ui');
goog.require('ydn.crm.ui.UserSetting');
goog.require('ydn.ui');



/**
 * Control HUB stick to right side of document.
 * @constructor
 * @struct
 */
ydn.crm.inj.Hud = function() {

  /**
   * @type {Element}
   * @private
   */
  this.root_el_ = null;
  /**
   * @protected
   * @type {goog.events.EventHandler}
   */
  this.handler = new goog.events.EventHandler(this);

};


/**
 * @protected
 * @type {goog.log.Logger}
 */
ydn.crm.inj.Hud.prototype.logger = goog.log.getLogger('ydn.crm.inj.Hud');


/**
 * @const
 * @type {string}
 */
ydn.crm.inj.Hud.CSS_CLASS_INVALID = 'invalid';


/**
 * @const
 * @type {string}
 */
ydn.crm.inj.Hud.CSS_CLASS_INVALID_LOGIN_PANEL = 'invalid-login-panel';


/**
 * @const
 * @type {string}
 */
ydn.crm.inj.Hud.CSS_CLASS_SETUP = 'setup-panel';


/**
 * @param {Event} e
 * @private
 */
ydn.crm.inj.Hud.prototype.onClick_ = function(e) {
  this.setDrawerOpen(!this.root_el_.classList.contains('open'));
};


/**
 * Open or close drawer.
 * @param {boolean} val
 */
ydn.crm.inj.Hud.prototype.setDrawerOpen = function(val) {
  this.root_el_.classList.toggle('open');
  var arrow = this.root_el_.querySelector('.arrow-box');
  arrow.innerHTML = '';
  if (val) {
    this.root_el_.classList.add('open');
    arrow.appendChild(ydn.crm.ui.createSvgIcon('arrow-drop-left'));
  } else {
    this.root_el_.classList.remove('open');
    arrow.appendChild(ydn.crm.ui.createSvgIcon('arrow-drop-right'));
  }
};


/**
 * This will render side
 * @param {Function=} opt_cb callback after positioning.
 */
ydn.crm.inj.Hud.prototype.render = function(opt_cb) {

  var temp = ydn.ui.getTemplateById('hub-template').content;
  var div = document.createElement('div');
  div.appendChild(temp.cloneNode(true));

  this.root_el_ = div.firstElementChild;
  if (ydn.gmail.Utils.isOfflineGmailApp()) {
    this.root_el_.classList.add(ydn.crm.ui.CSS_CLASS_GMAIL_OFFLINE);
  }

  document.body.appendChild(this.root_el_);

  var a_option = this.root_el_.querySelector('a[name=option-page-url]');
  a_option.href = chrome.extension.getURL(ydn.crm.base.OPTION_PAGE);

  var popup = this.root_el_.querySelector('.hud-popup');
  var btn = this.root_el_.querySelector('.hud-button');
  goog.events.listen(btn, 'click', this.onClick_, false, this);

  var logo = this.root_el_.querySelector('.logo-box');
  logo.appendChild(ydn.crm.ui.createSvgIcon('ydn-logo'));
  var arrow = this.root_el_.querySelector('.arrow-box');
  arrow.appendChild(ydn.crm.ui.createSvgIcon('arrow-drop-right'));

  var dom = goog.dom.getDomHelper();
  var root = this.root_el_;

  var header = this.root_el_.querySelector('.popup-header');
  var status_el = document.createElement('div');
  var status = new ydn.crm.msg.StatusBar();
  status.render(header);
  ydn.crm.msg.Manager.addConsumer(status);

  var a = dom.createElement('a');
  a.textContent = 'Setup';

  if (ydn.crm.base.isEmailTracker()) {
    a.href = chrome.extension.getURL(ydn.crm.base.LOGIN_PAGE);
    a.setAttribute('data-window-height', '600');
    a.setAttribute('data-window-width', '600');
  } else {
    a.href = chrome.extension.getURL(ydn.crm.base.SETUP_PAGE) + '#modal';
    a.setAttribute('data-window-height', '600');
    a.setAttribute('data-window-width', '800');
  }
  a.className = 'maia-button blue';

  var link_panel = dom.createDom('div', ydn.crm.inj.Hud.CSS_CLASS_SETUP, [
    dom.createDom('div', null, a)
  ]);
  goog.style.setElementShown(link_panel, false);

  var invalid_login = dom.createDom('div', ydn.crm.inj.Hud.CSS_CLASS_INVALID_LOGIN_PANEL);
  goog.style.setElementShown(invalid_login, false);
  header.appendChild(link_panel);
  header.appendChild(invalid_login);


  var a_grant = header.querySelector('div.' +
      ydn.crm.inj.Hud.CSS_CLASS_SETUP + ' a');
  this.handler.listen(a_grant, 'click', ydn.ui.openPageAsDialog, true);

  var us = ydn.crm.ui.UserSetting.getInstance();

  this.handler.listen(us,
      [ydn.crm.ui.UserSetting.EventType.LOGOUT,
        ydn.crm.ui.UserSetting.EventType.LOGIN],
      this.handleUserLogin_);

  this.root_el_.querySelector('a[name=option-page-url]').textContent =
      chrome.i18n.getMessage('Options');
  this.root_el_.querySelector('a[name=help]').textContent =
      chrome.i18n.getMessage('Help');

  var resizer = this.root_el_.querySelector('.top-resizer');
  this.handler.listen(resizer, goog.events.EventType.MOUSEDOWN, this.onRowDragStart_);

  this.loadPosition_(opt_cb);

  this.handler.listen(document.body, ydn.crm.ui.EventType.DRAWER_REQUEST, this.onDrawerRequest_);
};


/**
 * @param {goog.events.BrowserEvent} be
 * @private
 */
ydn.crm.inj.Hud.prototype.onDrawerRequest_ = function(be) {
  var ce = be.getBrowserEvent();
  goog.asserts.assertObject(ce);
  var open = goog.object.getValueByKeys(ce, 'detail', 'open');
  this.setDrawerOpen(open == true);
};


/**
 * @private
 */
ydn.crm.inj.Hud.prototype.savePosition_ = function() {
  var hud_base = document.getElementById('sticky-hud-base');
  var top = hud_base.style.top;
  var top_px = top.substr(0, top.length - 2);

  var size = {
    'top': top_px
  };
  var key = ydn.crm.base.ChromeLocalKey.POSITION_HUD_BASE;
  var obj = {};
  obj[key] = size;
  chrome.storage.local.set(obj);
};


/**
 * @param {Function=} opt_cb callback.
 * @private
 */
ydn.crm.inj.Hud.prototype.loadPosition_ = function(opt_cb) {
  var key = ydn.crm.base.ChromeLocalKey.POSITION_HUD_BASE;
  var hud_base = document.getElementById('sticky-hud-base');
  chrome.storage.local.get(key, function(obj) {
    var size = obj[key];
    var top_px = 200; // default
    if (size) {
      top_px = size['top'];
      if (goog.isString(top_px)) {
        top_px = parseInt(top_px, 10);
      }
      if (top_px > 50 && top_px < 400) {
        hud_base.style.top = top_px + 'px';
      }
    }
    // set max-height so that, container has scroll
    var container = hud_base.querySelector('.popup-content');
    container.style.maxHeight = 'calc(100vh - ' + (top_px + 40) + 'px)';
    if (opt_cb) {
      opt_cb();
    }
  });
};


/**
 * @param {goog.events.BrowserEvent} e
 * @private
 */
ydn.crm.inj.Hud.prototype.onRowDragStart_ = function(e) {

  // console.log('start')
  // FIXME: how to change drag cursor shape?

  this.handler.listen(document.body, goog.events.EventType.MOUSEMOVE, this.onRowResize_);
  this.handler.listen(document.body, goog.events.EventType.MOUSEUP, this.onRowDragEnd_);
  document.body.style.cursor = 'row-resize';
};


/**
 * @param {goog.events.BrowserEvent} e
 * @private
 */
ydn.crm.inj.Hud.prototype.onRowDragEnd_ = function(e) {
  // console.log('end')
  document.body.style.cursor = '';
  var hud_base = document.getElementById('sticky-hud-base');
  this.handler.unlisten(document.body, goog.events.EventType.MOUSEMOVE, this.onRowResize_);
  this.handler.unlisten(document.body, goog.events.EventType.MOUSEUP, this.onRowDragEnd_);
  this.savePosition_();
};


/**
 * @param {goog.events.BrowserEvent} e
 * @private
 */
ydn.crm.inj.Hud.prototype.onRowResize_ = function(e) {
  var hud_base = document.getElementById('sticky-hud-base');
  // console.log(e.clientY);
  if (e.clientY > 50 && e.clientY < 400) {
    var top = e.clientY - 2;
    // console.log('setting ' + top);
    hud_base.style.top = top + 'px';
  }

};


/**
 * @param {goog.events.Event} e
 * @private
 */
ydn.crm.inj.Hud.prototype.handleUserLogin_ = function(e) {
  var us = /** @type {ydn.crm.ui.UserSetting} */ (ydn.crm.ui.UserSetting.getInstance());
  var header = this.root_el_.querySelector('.popup-header');

  var setup = header.querySelector('.' + ydn.crm.inj.Hud.CSS_CLASS_SETUP);
  var invalid_login_panel = header.querySelector('.' +
      ydn.crm.inj.Hud.CSS_CLASS_INVALID_LOGIN_PANEL);

  goog.log.fine(this.logger, 'handling user login');
  var content = this.root_el_.querySelector('.popup-content');

  if (us.isLogin()) {
    goog.style.setElementShown(setup, false);
    goog.style.setElementShown(content, true);
    if (us.hasValidLogin()) {
      goog.style.setElementShown(invalid_login_panel, false);
      this.root_el_.classList.remove(ydn.crm.inj.Hud.CSS_CLASS_INVALID);
    } else {
      this.root_el_.classList.add(ydn.crm.inj.Hud.CSS_CLASS_INVALID);
      var data = {
        ydn_login: us.getLoginEmail(),
        ext_id: chrome.runtime ? chrome.runtime.id : 'iccdnijlhdogaccaiafdpjmbakdcdakk',
        gmail: us.getGmail() || '?'
      };
      goog.soy.renderElement(invalid_login_panel, templ.ydn.crm.inj.wrongLogin, data);
      goog.style.setElementShown(invalid_login_panel, true);
    }
  } else {
    goog.style.setElementShown(content, true);
    goog.style.setElementShown(setup, true);
    this.setDrawerOpen(true);
    goog.style.setElementShown(invalid_login_panel, false);

  }
};


/**
 * @return {Element}
 */
ydn.crm.inj.Hud.prototype.getFooterElement = function() {
  return this.root_el_.querySelector('.popup-footer');
};


/**
 * Add UI component.
 * @param {goog.ui.Component} panel
 */
ydn.crm.inj.Hud.prototype.addPanel = function(panel) {
  var popup_content = this.root_el_.querySelector('.popup-content');
  panel.render(popup_content);
};


