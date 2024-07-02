# Better Tree Tool for Raycast

## Description

Better Tree Tool is a Raycast extension that generates a customizable directory tree view. It allows users to visualize their directory structure, with options to show file sizes, sort entries, and customize the depth of the tree.

## Features

- Generate a tree view of any selected directory
- Customize tree depth
- Show or hide file sizes
- Exclude specific directories
- Edit the generated tree
- Copy the tree to clipboard

## Installation

1. Make sure you have [Raycast](https://www.raycast.com/) installed.
2. Clone this repository or download the source code.
3. Open a terminal and navigate to the project directory.
4. Run `npm install` to install the dependencies.
5. Run `npm run build` to build the extension.
6. In Raycast, go to Extensions > Add Extension and select the built extension.

## Usage

1. In Finder, select the directory you want to generate a tree for.
2. Open Raycast and search for "Better Tree Tool".
3. Run the command to generate the tree.
4. Use the provided actions to customize the tree view:
   - Toggle file size display
   - Edit the tree manually
   - Copy the tree to clipboard

## Configuration

You can configure the following options in the extension preferences:

- Default depth: Set the default depth for tree generation
- Excluded directories: Specify directories to exclude from the tree

## Command Arguments

The extension supports the following command arguments:

- `depth`: Specify the depth of the tree (overrides the default depth)
- `exclude`: Specify additional directories to exclude (comma-separated)
- `showSize`: Set to "false" to hide file sizes by default

## Development

To work on this extension:

1. Clone the repository
2. Run `npm install` to install dependencies
3. Make your changes in the `src` directory
4. Use `npm run dev` to watch for changes and automatically rebuild the extension
5. Use `npm run build` to create a production build

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)
