#!/usr/bin/env sh

######################################################################
# @author      : kistenklaus (karlsasssie@gmail.com)
# @file        : linux_build
# @created     : Sonntag Mai 12, 2024 17:50:24 CEST
#
# @description : 
######################################################################

npm run tauri build
rm -f ~/.cargo/bin/canzero
mv src-tauri/target/release/canzero ~/.cargo/bin
rm -rf ~/.cargo/bin/xcompl/
mkdir -p ~/.cargo/bin/xcompl 
mv src-tauri/xcompl ~/.cargo/bin/xcompl



