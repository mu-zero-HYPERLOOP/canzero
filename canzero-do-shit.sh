#!/bin/bash

path_to_exe=src-tauri/target/release/canzero


npm run tauri build

$path_to_exe config set network_config/config.yaml

$path_to_exe server start

$path_to_exe
