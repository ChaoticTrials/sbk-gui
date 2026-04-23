#!/bin/bash

update-mime-database /usr/share/mime 2>/dev/null || true
update-desktop-database /usr/share/applications 2>/dev/null || true

# Copy the scalable MIME icon into every theme that ships application-x-generic.svg
# so that choose_icon() resolves by name order within the same theme rather than
# falling back to application-x-generic from a higher-priority theme.
SVG=/usr/share/icons/hicolor/scalable/mimetypes/application-x-sbk.svg
if [ -f "$SVG" ] && command -v gtk-update-icon-cache >/dev/null 2>&1; then
    for dir in /usr/share/icons/*/; do
        if [ -d "${dir}scalable/mimetypes" ]; then
            cp "$SVG" "${dir}scalable/mimetypes/application-x-sbk.svg" 2>/dev/null || true
            gtk-update-icon-cache -f -t "$dir" 2>/dev/null || true
        fi
    done
fi
