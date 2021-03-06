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
 * @fileoverview Calendar setting panel.
 *
 * @author kyawtun@yathit.com (Kyaw Tun)
 */


goog.provide('ydn.crm.gdata.CalendarSettingPanel');
goog.require('goog.dom.TagName');
goog.require('goog.dom.forms');
goog.require('goog.events.EventHandler');
goog.require('goog.style');
goog.require('ydn.crm.gdata.SelectCalendarDialog');
goog.require('ydn.crm.msg.Manager');
goog.require('ydn.ds.gapps.cal');
goog.require('ydn.ui');



/**
 * Calendar setting panel.
 * @param {ydn.crm.ui.UserSetting} us
 * @constructor
 * @struct
 */
ydn.crm.gdata.CalendarSettingPanel = function(us) {
  /**
   * @protected
   * @type {Element}
   */
  this.root = document.createElement('div');

  /**
   * @type {?GApps.CalendarList}
   * @private
   */
  this.cal_list_ = null;

  /**
   * Selected calender.
   * @type {?string}
   * @private
   */
  this.cal_id_ = null;

  /**
   * @protected
   * @type {ydn.crm.ui.UserSetting}
   */
  this.us = us;

  /**
   * @protected
   * @type {goog.events.EventHandler}
   */
  this.handler = new goog.events.EventHandler(this);
};


/**
 * @define {boolean} debug flag.
 */
ydn.crm.gdata.CalendarSettingPanel.DEBUG = false;


/**
 * @param {Element} ele
 */
ydn.crm.gdata.CalendarSettingPanel.prototype.render = function(ele) {

  var temp = ydn.ui.getTemplateById('calendar-setting-panel-template').content;
  this.root.appendChild(temp.cloneNode(true));
  ele.appendChild(this.root);

  var detail = this.root.querySelector('details');
  this.handler.listen(detail, 'click', this.onDetailsClick_);

  var sync_el = this.root.querySelector('#enable-calendar-sync');
  var a_change = this.root.querySelector('button[name=change-sync-calender]');
  this.handler.listen(sync_el, 'click', this.onSyncClick_);
  this.handler.listen(a_change, 'click', this.onSelectBtnClick_);
};


/**
 * @param {Event} ev
 * @private
 */
ydn.crm.gdata.CalendarSettingPanel.prototype.onDetailsClick_ = function(ev) {
  var is_open = !ev.currentTarget.hasAttribute('open');
  if (is_open) {
    this.refresh();
  }
};


/**
 * @private
 * @param {goog.events.BrowserEvent} e
 */
ydn.crm.gdata.CalendarSettingPanel.prototype.onSyncClick_ = function(e) {
  var sync_el = this.root.querySelector('#enable-calendar-sync');
  this.setSync(!!goog.dom.forms.getValue(sync_el));
};


/**
 * @private
 * @param {goog.events.BrowserEvent} e
 */
ydn.crm.gdata.CalendarSettingPanel.prototype.onSelectBtnClick_ = function(e) {
  e.preventDefault();
  e.stopPropagation();
  this.showCalSelectDialog();
};


/**
 * Set sync.
 * @param {boolean} val
 */
ydn.crm.gdata.CalendarSettingPanel.prototype.setSync = function(val) {
  if (val) {
    this.showCalSelectDialog();
  }
};


/**
 * Show calendar selection modal dialog.
 */
ydn.crm.gdata.CalendarSettingPanel.prototype.showCalSelectDialog = function() {

  ydn.crm.gdata.SelectCalendarDialog.showModal(this.us, this.cal_list_, this.cal_id_)
      .addCallbacks(function(result) {
        this.cal_id_ = result;
        // do a full refresh.
        this.refresh();
      }, function(e) {
        window.console.error(e);
      }, this);
};


/**
 * Find suitable calendar id for syncing.
 * @return {?string}
 * @private
 */
ydn.crm.gdata.CalendarSettingPanel.prototype.findCandidateCal_ = function() {
  for (var i = 0; i < this.cal_list_.items.length; i++) {
    var cal = this.cal_list_.items[i];
    if (cal.primary) {
      return cal.id;
    }
    if (cal.accessRole == 'owner') {
      return cal.id;
    }
  }
  return null;
};


/**
 * Get selected calendar item.
 * @return {GApps.CalendarListEntry}
 * @private
 */
ydn.crm.gdata.CalendarSettingPanel.prototype.getSelectedCalendar_ = function() {
  if (!this.cal_id_) {
    return null;
  }
  for (var i = 0; i < this.cal_list_.items.length; i++) {
    var cal = this.cal_list_.items[i];
    if (cal.id == this.cal_id_) {
      return this.cal_list_.items[i];
    }
  }
  return null;
};


/**
 * @private
 */
ydn.crm.gdata.CalendarSettingPanel.prototype.refresh_ = function() {
  var msg_el = this.root.querySelector('.message');
  msg_el.textContent = '';
  var sync_el = this.root.querySelector('#enable-calendar-sync');

  var panel = this.root.querySelector('[name="sync-calendar-panel"]');
  goog.style.setElementShown(panel, !!this.cal_id_);
  var cal_name = this.root.querySelector('a[name="sync-calender-name"]');
  cal_name.textContent = this.cal_id_ || '';
  cal_name.href = '';
  goog.dom.forms.setValue(sync_el, !!this.cal_id_);

  if (this.cal_id_) {
    var cal = this.getSelectedCalendar_();
    if (cal) {
      cal_name.href = ydn.ds.gapps.cal.id2link(this.cal_id_);
      cal_name.textContent = cal.summary || 'My Calendar';
    } else {
      var msg = 'Sync Calendar "' + this.cal_id_ + '" not found.';
      msg_el.textContent = msg;
      ydn.crm.msg.Manager.addStatus(msg);
    }
  }
};


/**
 * Refresh UI.
 */
ydn.crm.gdata.CalendarSettingPanel.prototype.refresh = function() {
  var msg_el = this.root.querySelector('.message');
  msg_el.textContent = 'Loading data...';
  this.us.getSettingOnServer(ydn.crm.base.KeyRecordOnServer.USER_SETTING_GDATA_CAL)
      .addCallbacks(function(obj) {
        var setting = (/** @type {YdnCrm.UserSettingGDataCal} */(obj));
        this.cal_id_ = setting ? setting.syncCalId || null : null;
        if (this.cal_id_) {
          ydn.msg.getChannel().send(ydn.crm.ch.Req.GDATA_UPDATE,
              {'kind': ydn.gdata.Kind.CAL_EVENT});
        }
        ydn.msg.getChannel().send(ydn.crm.ch.Req.GAPPS_LIST_CAL)
            .addCallbacks(function(json) {
              if (ydn.crm.gdata.CalendarSettingPanel.DEBUG) {
                window.console.log(obj, json);
              }
              this.cal_list_ = json;
              this.refresh_();
            }, function(e) {
              window.console.error(e);
            }, this);
      }, function(e) {
        window.console.error(e);
      }, this);
};

