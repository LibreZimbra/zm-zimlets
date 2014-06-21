/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Zimlets
 * Copyright (C) 2008, 2009, 2010, 2013 Zimbra, Inc.
 * 
 * The contents of this file are subject to the Common Public Attribution License Version 1.0 (the “License”);
 * you may not use this file except in compliance with the License. 
 * You may obtain a copy of the License at: http://www.zimbra.com/license
 * The License is based on the Mozilla Public License Version 1.1 but Sections 14 and 15 
 * have been added to cover use of software over a computer network and provide for limited attribution 
 * for the Original Developer. In addition, Exhibit A has been modified to be consistent with Exhibit B. 
 * 
 * Software distributed under the License is distributed on an “AS IS” basis, 
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. 
 * See the License for the specific language governing rights and limitations under the License. 
 * The Original Code is Zimbra Open Source Web Client. 
 * The Initial Developer of the Original Code is Zimbra, Inc. 
 * All portions of the code are Copyright (C) 2008, 2009, 2010, 2013 Zimbra, Inc. All Rights Reserved. 
 * ***** END LICENSE BLOCK *****
 */

YahooSearch = function(parent, controller) {
	if (arguments.length == 0) { return; }
	this._controller = controller;

	if (this._controller._zimlet._settingPane) {
		// create composite to place the YahooSearch
		DwtComposite.call(this, {parent:parent, className:"YahooSearch", posStyle:Dwt.ABSOLUTE_STYLE, id:"YahooSearch"});

		this._searchElement = document.getElementById("YahooSearch");
		this._searchElement.innerHTML = '<iframe class="YahooSearch" name="YahooSearchFrame" id="YahooSearchFrame" frameborder="0"/>';
	}
};

YahooSearch.prototype = new DwtComposite;
YahooSearch.prototype.constructor = new YahooSearch;

//Yahoo Search
YahooSearch.prototype.searchYahoo =
function(query) {
	var searchUrl = ZmMsg["ysearchURL"];
	if(!searchUrl || searchUrl == "" || searchUrl == undefined){
		searchUrl = "http://search.yahoo.com";
	}
	if(query && query != "Search the Web...") {
		searchUrl += '/search?p='+query+'&fr=zim-maila', '_blank';
	} else {
		searchUrl += '/?fr=zim-maila';
	}

	if (this._controller._zimlet._settingPane) {
		frames['YahooSearchFrame'].location.href = searchUrl;
		frames['YahooSearchFrame'].focus();
	} else {
		window.open(searchUrl);
	}
};
