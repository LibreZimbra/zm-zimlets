# SPDX-License-Identifier: AGPL-3.0-or-later

ANT_TARGET = package-zimlets jar

INSTALL_FILES_JETTY_ETC         = build/zimlet.web.xml.in
INSTALL_FILES_WA_SERVICE_WEBINF = conf/zimbra.tld
INSTALL_FILES_ZIMLETS           = build/dist/zimlets/*.zip

all: build-ant-autover

include build.mk

install:
	cp conf/web.xml.production        build/zimlet.web.xml.in
	$(MAKE) install-common

clean: clean-ant
