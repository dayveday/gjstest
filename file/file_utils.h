// Copyright 2010 Google Inc. All Rights Reserved.
// Author: jacobsa@google.com (Aaron Jacobs)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Utility functions for dealing with files.

#ifndef FILE_FILE_UTILS_H_
#define FILE_FILE_UTILS_H_

#include "base/basictypes.h"

// Return the contents of the file at the given path, crashing on failure.
string ReadFileOrDie(const string& path);

// Write the supplied string to the given path, crashing on failure.
void WriteStringToFileOrDie(const string& str, const string& path);

// Strip an optional directory name from the supplied path, returning only the
// file name.
string Basename(const string& path);

// Recursively find all regular files in the supplied directory.
void FindFiles(const string& directory, vector<string>* files);

#endif  // FILE_FILE_UTILS_H_
