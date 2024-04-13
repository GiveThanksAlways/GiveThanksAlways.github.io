#!/bin/bash

# Ask for the title of the markdown file
echo "Enter the title of your markdown file:"
read title

# Replace spaces with hyphens and make all characters lowercase
filename="$(date +%Y-%m-%d)-$(echo $title | tr ' ' '-' | tr '[:upper:]' '[:lower:]').md"

# Define the directory where the file will be created
directory="_posts"
directoryDir="assets/custom"

# Define the path to the template file
template="$directoryDir/template.md"

# Copy the template file to the new file name
cp "$template" "$directory/$filename"

echo "Markdown file created from template: $directoryDir/$filename"
echo "cp $template $directory/$filename"
