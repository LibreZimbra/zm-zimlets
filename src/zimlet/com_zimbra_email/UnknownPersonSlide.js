/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Zimlets
 * Copyright (C) 2006, 2007, 2008, 2009, 2010 Zimbra, Inc.
 * 
 * The contents of this file are subject to the Zimbra Public License
 * Version 1.3 ("License"); you may not use this file except in
 * compliance with the License.  You may obtain a copy of the License at
 * http://www.zimbra.com/license.
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * ***** END LICENSE BLOCK *****
 */

/**
* A Email tooltip class that adds a blank slide when UnknownPersonSlide is not loaded. 
* Usually this is for customers outside of VMWare where they dont have access to 
* UnknownPersonSlide but can still use LinkedIn, TwitterSearch etc Zimlets
*/
function UnknownPersonSlide() {
}

//Static variables
UnknownPersonSlide.PHOTO_ID = "unkownPerson_photoBG";
UnknownPersonSlide.PHOTO_PARENT_ID = "unkownPerson_photoBGDiv";
UnknownPersonSlide.TEXT_DIV_ID = "unkownPerson_TextDiv";

/**
* Implement onEmailHoverOver to get notified by Email tooltip zimlet.
* This function registers UnkownPerson Zimlet as a subscriber Zimlet
*/
UnknownPersonSlide.prototype.onEmailHoverOver =
function(emailZimlet) {
	emailZimlet.addSubscriberZimlet(this, false);
	this.emailZimlet = emailZimlet;
	this._alwaysSetTooltipToSmall();
};

UnknownPersonSlide.prototype._alwaysSetTooltipToSmall =
function() {
	var tooltipSize = EmailToolTipPrefDialog.DIMENSIONS[EmailToolTipPrefDialog.SIZE_VERYSMALL];
	var size = tooltipSize.replace(/px/ig, "");
	var arry = size.split(" x ");
	this._tooltipWidth = arry[0];
	this._tooltipHeight = arry[1];
};

/**
* This is called by Email Zimlet when user hoverovers an email
*/
UnknownPersonSlide.prototype.showTooltip =
function() {
	var emailAddress = this.emailZimlet.emailAddress.toLowerCase();	
	this._handleImgLoadFailure();
};

UnknownPersonSlide.prototype._handleImgLoadFailure =
function() {//onfailure to load img w/in 5 secs, load an dataNotFound image
	var img = new Image();
	img.onload = AjxCallback.simpleClosure(this._handleImageLoad, this, img);
	img.id = UnknownPersonSlide.PHOTO_ID;
	img.src = this.emailZimlet.getResource("img/UnknownPerson_dataNotFound.jpg");
};

UnknownPersonSlide.prototype._handleImageLoad =
function(img) {
	this.emailZimlet.hideBusyImg();
	var tthtml = this._getTooltipBGHtml();
	var selectCallback = new AjxCallback(this, this._handleSlideSelect, img);
	this._slide = new EmailToolTipSlide(tthtml, true, "UnknownPerson_contact", selectCallback, this.emailZimlet.getMessage("contact"));
	this.emailZimlet.slideShow.addSlide(this._slide);
	this._slide.select();
	this._addClickHandlers();
};

UnknownPersonSlide.prototype._addClickHandlers =
function() {
	document.getElementById(UnknownPersonSlide.TEXT_DIV_ID).onmouseup = AjxCallback.simpleClosure(this._handleRightClick, this);
	document.getElementById(UnknownPersonSlide.PHOTO_PARENT_ID).onmouseup = AjxCallback.simpleClosure(this._handleRightClick, this);
};

UnknownPersonSlide.prototype._handleRightClick =
function(ev) {
	var rightclick;
	if (!ev) {
		var ev = window.event;
	}
	if (ev.which){
		rightclick = (ev.which == 3);
	} else if (ev.button) {
		rightclick = (ev.button == 2);
	}
	if(!rightclick) {
		return;
	}
	this.emailZimlet.contextMenu.popup(null, this.emailZimlet.x, this.emailZimlet.y);
	setTimeout(AjxCallback.simpleClosure(this.emailZimlet.slideShow.hideTooltipVeil, this.emailZimlet.slideShow), 200);
};

UnknownPersonSlide.prototype._handleSlideSelect =
function(img) {
	if (this._slide.loaded) {
		return;
	}
	if (img) {
		var div = document.getElementById(UnknownPersonSlide.PHOTO_PARENT_ID);
		div.appendChild(img);
		if (this.emailZimlet.emailAddress.indexOf(UnknownPersonSlide.DOMAIN) != -1) {
			img.onclick =  AjxCallback.simpleClosure(this._handleProfileImageClick, this); 
			img.style.cursor = "pointer";
		}
	}

	if(this.emailZimlet.emailAddress.indexOf(UnknownPersonSlide.DOMAIN)  == -1) {
		var contactList = AjxDispatcher.run("GetContacts");
		var contact = contactList ? contactList.getContactByEmail(this.emailZimlet.emailAddress) : null;
		if (contact) {
			this._GALRequestCallback(img, null, contact.attr);
		} else {
			this._GALRequestCallback(img, null);
		}		
	} else {//make gal search request
		var jsonObj, request, soapDoc;
		jsonObj = {SearchGalRequest:{_jsns:"urn:zimbraAccount"}};
		request = jsonObj.SearchGalRequest;
		request.type = "account";
		request.name = this.emailZimlet.emailAddress;
		request.offset = 0;
		request.limit = 3;
		var callback = new AjxCallback(this, this._GALRequestCallback, img);
		appCtxt.getAppController().sendRequest({jsonObj:jsonObj,asyncMode:true,callback:callback, noBusyOverlay:true});
	}
	this._slide.loaded = true;
};

UnknownPersonSlide.prototype._GALRequestCallback =
function(img, response) {
	var validResponse = false;
	var attrs = {};
	if(response) {
		var data = response.getResponse();	
		var cn = data.SearchGalResponse.cn;
		if (cn && cn[0] && cn[0]._attrs) {
			attrs = data.SearchGalResponse.cn[0]._attrs;
			validResponse = true;
		}
	}
	
	if(!validResponse) {
		if(this.emailZimlet.fullName) {
			attrs["fullName"] = this.emailZimlet.fullName;
		}
		if(this.emailZimlet.emailAddress) {
			attrs["email"] = this.emailZimlet.emailAddress;
		}
	}
	this._setContactDetails(attrs);
	this._setHeightAndWidthOfImage();
	this._popupToolTip();
};

UnknownPersonSlide.prototype._popupToolTip =
function() {
	this.emailZimlet.tooltip.popup(this.emailZimlet.x, this.emailZimlet.y, true, null);
};

UnknownPersonSlide.prototype._setHeightAndWidthOfImage =
function() {
	var el = document.getElementById(UnknownPersonSlide.PHOTO_ID);
	el.height = 80;
	el.width = 65;
};


UnknownPersonSlide.prototype._getTooltipBGHtml =
function(email) {
	var width = ";";
	var left = ";";
	if (AjxEnv.isIE) {
		var width = "width:100%;";
		var left = "left:3%;";
	}
	var subs = {
		photoParentId: UnknownPersonSlide.PHOTO_PARENT_ID,
		textDivId: UnknownPersonSlide.TEXT_DIV_ID,
		width: width,
		left: left
	};
	return AjxTemplate.expand("com_zimbra_email.templates.Email1#Frame", subs);
};

UnknownPersonSlide.prototype._setContactDetails =
function(attrs) {
	if (attrs.workState || attrs.workCity || attrs.workStreet || attrs.workPostalCode) {
		var workState = attrs.workState ? attrs.workState : "";
		var workCity = attrs.workCity ? attrs.workCity : "";
		var workStreet = attrs.workStreet ? attrs.workStreet : "";
		var workPostalCode = attrs.workPostalCode ? attrs.workPostalCode : "";
		var address = [workStreet, " ", workCity, " ", workState, " ", workPostalCode].join("");
		attrs["address"] = AjxStringUtil.trim(address);
	}

	attrs["rightClickForMoreOptions"] = this.emailZimlet.getMessage("rightClickForMoreOptions");
	var iHtml = AjxTemplate.expand("com_zimbra_email.templates.Email1#ContactDetails", attrs);
	this._setTextDivHeight(iHtml);
	document.getElementById(UnknownPersonSlide.TEXT_DIV_ID).innerHTML = iHtml;
	document.getElementById("UnknownPersonSlide_EmailAnchorId").onclick =  AjxCallback.simpleClosure(this._openCompose, this); 
};

UnknownPersonSlide.prototype._setTextDivHeight =
function(html) {
	if (!this._tempdiv) {
		this._tempdiv = document.createElement("div");
		this._tempdiv.style.left = -1000;
		this.emailZimlet.getShell().getHtmlElement().appendChild(this._tempdiv);
	}
	this._tempdiv.innerHTML = html;
	this._textDivOffsetHeight = this._tempdiv.offsetHeight + this._tempdiv.offsetHeight*0.25;
	this._tempdiv.innerHTML = "";
};

