#!/bin/bash

update-mime-database /usr/share/mime 2>/dev/null || true
update-desktop-database /usr/share/applications 2>/dev/null || true

if command -v gtk-update-icon-cache >/dev/null 2>&1; then
    for dir in /usr/share/icons/*/; do
        rm -f "${dir}scalable/mimetypes/application-x-sbk.svg" 2>/dev/null || true
        [ -f "${dir}index.theme" ] && gtk-update-icon-cache -f -t "$dir" 2>/dev/null || true
    done
fi
