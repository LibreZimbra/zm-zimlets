/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Zimlets
 * Copyright (C) 2009, 2010, 2011 Zimbra, Inc.
 *
 * The contents of this file are subject to the Zimbra Public License
 * Version 1.3 ("License"); you may not use this file except in
 * compliance with the License.  You may obtain a copy of the License at
 * http://www.zimbra.com/license.
 *
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * ***** END LICENSE BLOCK *****
 * @Author Raja Rao DV
 *
 */

ZmClick2CallDlg = function(shell, parent) {
	this.toPhoneNumber = "";
	this.fromPhoneNumber = "";
	this.zimlet = parent;
	this.soapCalls = new ZmClick2CallProviderAPIs(this.zimlet, this.zimlet.server, this.zimlet.email, this.zimlet.password);

	this._dialogView = new DwtComposite(appCtxt.getShell());
	this._dialogView.setSize(300, 150);
	DwtDialog.call(this, {
				parent : shell,
				className : "ZmClick2CallDlg",
				title : this.zimlet.getMessage("click2callDlgTitle"),
				view: this._dialogView,
				standardButtons : [ DwtDialog.NO_BUTTONS],
				mode: DwtBaseDialog.MODELESS
			});

	this._setWhiteBackground();
	this._buttonDesc = {}; //set this to null otherwise esc will throw expn
	this._callingStr = this.zimlet.getMessage("calling");
	this._connectionFailedStr  = this.zimlet.getMessage("connectionFailedTryRedialling");
	this._connectionSuccessfulStr = this.zimlet.getMessage("connectionSuccessfulStr");
	this._callHungUpStr = this.zimlet.getMessage("callHungUp");
	this._addMinimizeAndCloseBtns();
};

ZmClick2CallDlg.prototype = new DwtDialog;
ZmClick2CallDlg.prototype.constructor = ZmClick2CallDlg;

ZmClick2CallDlg.prototype.CONTROLS_TEMPLATE = null;

ZmClick2CallDlg.PHOTO_ID = "click2CallDlg_photoBG";
ZmClick2CallDlg.PHOTO_PARENT_ID = "click2CallDlg_photoBGDiv";
ZmClick2CallDlg.TEXT_DIV_ID = "click2CallDlg_TextDiv";


ZmClick2CallDlg.prototype._dragStart = function(x, y){
 //override but dont do anything
};

//Set WindowInnerContainer cell's bg to white
ZmClick2CallDlg.prototype._setWhiteBackground = function(){
 	var el = this._dialogView.getHtmlElement();
	while (el && el.className &&  el.className.indexOf( "WindowInnerContainer") == -1) {
				el = el.parentNode;
	}
	if (el == null) {
		return;
	}
	el.style.backgroundColor = "white";
};


ZmClick2CallDlg.prototype.popup = function() {

	DwtDialog.prototype.popup.call(this);
	this._searchAndShowContactInfo();
  	this._showAsCalling();
	this._animateCallingText();
	this._callingTxtInterval = setInterval(AjxCallback.simpleClosure(this._animateCallingText, this), 700);
};

ZmClick2CallDlg.prototype._addMinimizeAndCloseBtns = function() {
	var html = ["<table><tr><td class='minWidth' ></td>",
		"<td class='",this._titleEl.className,"' id='", this._titleEl.id,"'> ", this._titleEl.innerHTML, "</td>",
		"<td  width='18px' align=right ><div style='cursor:pointer;' id='FromPhoneDlg_minMaxBtn' class='ImgClick2Call-minimize-icon' /></td>",
		"<td  width='18px' align=right ><div style='cursor:pointer;' id='FromPhoneDlg_closeBtn' class='ImgClose' /></td>",
		"</tr></table>"];

	this._titleEl.parentNode.innerHTML = html.join("");
	this._minMaxeDlgBtn = document.getElementById("FromPhoneDlg_minMaxBtn");
	this._minMaxeDlgBtn.onclick = AjxCallback.simpleClosure(this._handleMinMaxDlg, this);
	this._closeDlgBtn = document.getElementById("FromPhoneDlg_closeBtn");
	this._closeDlgBtn.onclick = AjxCallback.simpleClosure(this._handleCloseDlg, this);
};

ZmClick2CallDlg.prototype._handleMinMaxDlg = function() {
	if(this._minMaxeDlgBtn.className == "ImgClick2Call-minimize-icon") {
		this._dlgTopPosB4Minimize = (this.getHtmlElement().style.top).replace("px", "");
		this._minMaxeDlgBtn.className = "ImgClick2Call-maximize-icon";
		this.getHtmlElement().style.top = (document.body.offsetHeight - 25) + "px";
	} else if(this._minMaxeDlgBtn.className == "ImgClick2Call-maximize-icon") {
		this._minMaxeDlgBtn.className = "ImgClick2Call-minimize-icon";
		this.getHtmlElement().style.top = this._dlgTopPosB4Minimize + "px";
	}
};

ZmClick2CallDlg.prototype._handleCloseDlg = function() {
	this.popdown();
};

ZmClick2CallDlg.prototype._searchAndShowContactInfo = function(limit, query, postCallback) {
	if (!limit) {
		limit = 1;
	}
	if (!query) {
		query = this.toPhoneNumber;
	}
	var jsonObj, request, soapDoc;
	jsonObj = {
		SearchRequest : {
			_jsns : "urn:zimbraMail"
		}
	};
	request = jsonObj.SearchRequest;
	request.types = "contact";
	request.query = query;
	request.offset = 0;
	request.limit = limit;
	if (!postCallback) {
		postCallback = "";
	}
	var callback = new AjxCallback(this, this._handleContactSearch,
			postCallback);
	appCtxt.getAppController().sendRequest({
				jsonObj : jsonObj,
				asyncMode : true,
				callback : callback,
				noBusyOverlay : true
			});
};

ZmClick2CallDlg.prototype._handleContactSearch = function(postCallback, response) {
	var photoUrl;
	var attrs = {};
	if (response) {
		var contact;
		var data = response.getResponse();
		var cn = data.SearchResponse.cn;
		if (postCallback && postCallback != "") {
			postCallback.run(cn);
			return;
		}
		if (cn) {
			contact = cn[0];
		}
		if (contact && contact._attrs) {
			attrs = contact._attrs;
			if (attrs.image) {
				var msgFetchUrl = appCtxt.get(ZmSetting.CSFE_MSG_FETCHER_URI);
				photoUrl = [ msgFetchUrl, "/?auth=co&id=", contact.id,
					"&part=", attrs.image.part, "&t=",
					(new Date()).getTime() ].join("");
			}
			attrs["toPhoneNumber"] = this.toPhoneNumber;

			//this._setProfileImage(photoUrl);
			this._setContactDetails(attrs, photoUrl);
			return;
		}
	}
	// else, make gal request..
	var jsonObj, request, soapDoc;
	jsonObj = {
		SearchGalRequest : {
			_jsns : "urn:zimbraAccount"
		}
	};
	request = jsonObj.SearchGalRequest;
	request.type = "account";
	request.name = this.toPhoneNumber;
	request.offset = 0;
	request.limit = 1;
	var callback = new AjxCallback(this, this._handleGalSearchResponse);
	appCtxt.getAppController().sendRequest({
				jsonObj : jsonObj,
				asyncMode : true,
				callback : callback,
				noBusyOverlay : true
			});

};

ZmClick2CallDlg.prototype._handleGalSearchResponse = function(response) {
	var validResponse = false;
	var attrs = {};
	if (response) {
		var data = response.getResponse();
		var cn = data.SearchGalResponse.cn;
		if (cn && cn[0] && cn[0]._attrs) {
			attrs = data.SearchGalResponse.cn[0]._attrs;
			validResponse = true;
		}
	}
	attrs["toPhoneNumber"] = this.toPhoneNumber;
	var photoUrl;
	if (attrs["photoFileName"]) {
		var photoName = attrs["photoFileName"] ? attrs["photoFileName"]
				: "noname.jpg";
		photoUrl = ZmZimletBase.PROXY + ZmClick2CallDlg.PHOTO_BASE_URL
				+ attrs["photoFileName"];
	}
	//this._setProfileImage(photoUrl);
	this._setContactDetails(attrs, photoUrl);
};

ZmClick2CallDlg.prototype._getTooltipBGHtml = function(email) {
	var width = ";";
	var left = ";";
	if (AjxEnv.isIE) {
		var width = "width:100%;";
		var left = "left:3%;";
	}
	var subs = {
		photoParentId : ZmClick2CallDlg.PHOTO_PARENT_ID,
		textDivId : ZmClick2CallDlg.TEXT_DIV_ID,
		width : width,
		left : left
	};
	return AjxTemplate.expand("com_zimbra_click2call.templates.ZmClick2Call#Frame",
			subs);
};

ZmClick2CallDlg.prototype._setContactDetails = function(attrs, photoUrl) {
	var params = attrs;
	if (attrs.workState || attrs.workCity || attrs.workStreet
			|| attrs.workPostalCode) {
		var workState = attrs.workState ? attrs.workState : "";
		var workCity = attrs.workCity ? attrs.workCity : "";
		var workStreet = attrs.workStreet ? attrs.workStreet : "";
		var workPostalCode = attrs.workPostalCode ? attrs.workPostalCode : "";
		var address = [ workStreet, " ", workCity, " ", workState, " ",
			workPostalCode ].join("");
		params["address"] = AjxStringUtil.trim(address);
	}
	params = this._formatTexts(params);
	params.callingStr = this._callingStr;
	params.connectionFailedStr = this._connectionFailedStr;
	params.callSuccessfulStr = this._connectionSuccessfulStr;
	params.callHungUpStr = this._callHungUpStr;
	var iHtml = AjxTemplate.expand(
			"com_zimbra_click2call.templates.ZmClick2Call#ContactDetails", params);

	this._dialogView.getHtmlElement().innerHTML = iHtml;

	this._setProfileImage(photoUrl);

	var btn = new DwtButton({
				parent : this.zimlet.getShell()
			});
	btn.setText(this.zimlet.getMessage("hangUp"));// button name
	btn.setImage("Click2CallPhoneHangupBtn");
	btn.addSelectionListener(new AjxListener(this, this._handleHangUpBtnClick));
	document.getElementById("click2CallDlg_hangupBtnDiv").appendChild(
			btn.getHtmlElement());

	btn = new DwtButton({
				parent : this.zimlet.getShell()
			});
	btn.setText(this.zimlet.getMessage("redial"));// button name
	btn.setImage("Telephone");
	btn.addSelectionListener(new AjxListener(this, this._redialBtnHandler));
	document.getElementById("click2CallDlg_reDialBtnDiv").appendChild(
			btn.getHtmlElement());

	this._removeCustomAttrs(attrs);
};

ZmClick2CallDlg.prototype._showAsCalling = function() {
	var params = {click2CallDlg_hangupBtnDiv: "none",
		ringingPhoneMsgDiv:"block",
		click2CallDlg_reDialBtnDiv:"none",
		click2callDlg_reDialMsgDiv:"none",
		click2callDlg_callCompletedMsgDiv: "none",
		click2callDlg_callHungUpMsgDiv:"none"};

	this._showHideCardParts(params);
};

ZmClick2CallDlg.prototype.showErrorMsgAndRedial = function(errorMsg) {
	var params = {click2CallDlg_hangupBtnDiv: "none",
		ringingPhoneMsgDiv:"none",
		click2CallDlg_reDialBtnDiv:"block",
		click2callDlg_reDialMsgDiv:"block",
		click2callDlg_callCompletedMsgDiv: "none",
		click2callDlg_callHungUpMsgDiv:"none"};

	this._showHideCardParts(params);
};


ZmClick2CallDlg.prototype._showHungUpMsgAndRedial = function() {
	var params = {click2CallDlg_hangupBtnDiv: "none",
		ringingPhoneMsgDiv:"none",
		click2CallDlg_reDialBtnDiv:"block",
		click2callDlg_reDialMsgDiv:"none",
		click2callDlg_callCompletedMsgDiv: "none",
		click2callDlg_callHungUpMsgDiv:"block"};
	this._showHideCardParts(params);
};


ZmClick2CallDlg.prototype._showCallCompleted = function() {
	var params = {click2CallDlg_hangupBtnDiv: "block",
		ringingPhoneMsgDiv:"none",
		click2CallDlg_reDialBtnDiv:"none",
		click2callDlg_reDialMsgDiv:"none",
		click2callDlg_callCompletedMsgDiv: "block",
		click2callDlg_callHungUpMsgDiv:"none"};

	this._showHideCardParts(params);
};


ZmClick2CallDlg.prototype._showHideCardParts = function(params) {
	clearInterval(this._callingTxtInterval);
	var click2CallDlg_hangupBtnDiv = document.getElementById("click2CallDlg_hangupBtnDiv");
	var ringingPhoneMsgDiv = document.getElementById("ringingPhoneMsgDiv");
	var click2CallDlg_reDialBtnDiv = document.getElementById("click2CallDlg_reDialBtnDiv");
	var click2callDlg_reDialMsgDiv = document.getElementById("click2callDlg_reDialMsgDiv");
	var click2callDlg_callCompletedMsgDiv = document.getElementById("click2callDlg_callCompletedMsgDiv");
	var click2callDlg_callHungUpMsgDiv = document.getElementById("click2callDlg_callHungUpMsgDiv");

	if (click2CallDlg_hangupBtnDiv) {
		document.getElementById("click2CallDlg_hangupBtnDiv").style.display = params.click2CallDlg_hangupBtnDiv;
	}
	if (ringingPhoneMsgDiv) {
		document.getElementById("ringingPhoneMsgDiv").style.display = params.ringingPhoneMsgDiv;
	}
	if (click2CallDlg_reDialBtnDiv) {
		document.getElementById("click2CallDlg_reDialBtnDiv").style.display = params.click2CallDlg_reDialBtnDiv;
	}
	if (click2callDlg_reDialMsgDiv) {
		document.getElementById("click2callDlg_reDialMsgDiv").style.display = params.click2callDlg_reDialMsgDiv;
	}
	// document.getElementById("click2CallDlg_errDiv").innerHTML =
	// errorMsg;
	if (click2callDlg_callCompletedMsgDiv) {
		document.getElementById("click2callDlg_callCompletedMsgDiv").style.display = params.click2callDlg_callCompletedMsgDiv;
	}
	if (click2callDlg_callHungUpMsgDiv) {
		document.getElementById("click2callDlg_callHungUpMsgDiv").style.display = params.click2callDlg_callHungUpMsgDiv;
	}
};

ZmClick2CallDlg.prototype._animateCallingText = function() {
	var d = document.getElementById("click2Call_callingLabel");
	if (d) {
		if (this.__callingLableColor == "red") {
			this.__callingLableColor = "maroon";
		} else {
			this.__callingLableColor = "red";
		}
		d.style.color = this.__callingLableColor;
	} else {
		clearInterval(this._callingTxtInterval);
	}
};

ZmClick2CallDlg.prototype._redialBtnHandler = function() {
	this._callingTxtInterval = setInterval(AjxCallback.simpleClosure(this._animateCallingText, this), 700);
	this._showAsCalling();
	this.clickToCall(true);
};

ZmClick2CallDlg.prototype._removeCustomAttrs = function(attrs) {
	var customAttrs = ["rightClickForMoreOptions", "formattedEmail", "address", "toPhoneNumber",
						"callingStr", "connectionFailedStr", "callSuccessfulStr", "callHungUpStr"];
	for(var i =0; i < customAttrs.length; i++) {
		var attr = customAttrs[i];
		if (attrs[attr]) {
			delete attrs[attr];
		}
	}
};

ZmClick2CallDlg.prototype._formatTexts = function(attrs) {
	var email = attrs.email ? attrs.email : "";
	attrs["formattedEmail"] = email;
	if (email.length > 25) {
		var tmp = email.split("@");
		var fPart = tmp[0];
		var lPart = tmp[1];
		if (fPart.length > 25) {
			fPart = fPart.substring(0, 24) + "..";
		}
		attrs["formattedEmail"] = [ fPart, " @", lPart ].join("");
	}
	var fullName = attrs.fullName ? attrs.fullName : "";
	if (fullName == email) {
		attrs["fullName"] = "";
	}
	return attrs;
}

ZmClick2CallDlg.prototype._setProfileImage = function(photoUrl) {
	var div = document.getElementById(ZmClick2CallDlg.PHOTO_PARENT_ID);
	div.width = 65;
	div.height = 80;
	div.style.width = 65;
	div.style.height = 80;
	if (!photoUrl || photoUrl == "") {
		this._handleImgLoadFailure();
		return;
	}

	var img = new Image();
	img.src = photoUrl;
	img.onload = AjxCallback.simpleClosure(this._handleImageLoad, this, img);
};


ZmClick2CallDlg.prototype._handleImgLoadFailure = function() {// onfailure
	var img = new Image();
	img.onload = AjxCallback.simpleClosure(this._handleImageLoad, this, img);
	img.id = ZmClick2CallDlg.PHOTO_ID;
	img.src = this.zimlet.getResource("img/unknownPerson.jpg");
};

ZmClick2CallDlg.prototype._handleImageLoad = function(img) {
	var div = document.getElementById(ZmClick2CallDlg.PHOTO_PARENT_ID);
	if(!div) {
		return;
	}
	div.innerHTML = "";
	div.appendChild(img);
	img.width = 65;
	img.height = 80;
};

ZmClick2CallDlg.prototype.clickToCall = function(isClick2CallDlgShown) {
	if (!isClick2CallDlgShown) {
		this.popup();
	}
	this.soapCalls.doClick2Call(this.fromPhoneNumber,
			this.toPhoneNumber,  new AjxCallback(this,
			this._click2CallHandler));
};

ZmClick2CallDlg.prototype._click2CallHandler = function(response) {
	if (!response.success) {
		this.showErrorMsgAndRedial();
	} else {
		this._showCallCompleted();
	}
};

ZmClick2CallDlg.prototype._handleHangUpBtnClick = function() {
	this.soapCalls.doHangUp(this.fromPhoneNumber, new AjxCallback(this, this._hangupHandler));
};

ZmClick2CallDlg.prototype._hangupHandler = function(response) {
	if (!response.success) {
		this.showErrorMsgAndRedial();
	} else {
		this._showHungUpMsgAndRedial("");
	}
};


