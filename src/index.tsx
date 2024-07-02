import {
  getSelectedFinderItems,
  showToast,
  Toast,
  getPreferenceValues,
  Detail,
  ActionPanel,
  Action,
  openExtensionPreferences,
  Form,
} from "@raycast/api";
import { promises as fs } from "fs";
import path from "path";
import { useState, useEffect } from "react";
import { formatSize } from "./helper";

interface Preferences {
  defaultDepth: string; // default is 2
  defaultExcludedDirs?: string; // default is ".git,node_modules"
}

interface CommandArguments {
  depth?: string;
  exclude?: string;
  showSize?: string;
}

/**
 * Generates a tree-like structure of a directory and its contents.
 *
 * @param dir - The directory path to generate the tree for.
 * @param depth - The maximum depth to traverse (-1 for unlimited depth).
 * @param excludedDirs - A Set of directory names to exclude from the tree.
 * @param currentDepth - The current depth in the recursion (used internally).
 * @param parentPrefix - The prefix to use for the current level (used for proper indentation).
 * @returns A Promise that resolves to a string representation of the directory tree.
 */
async function generateTree(
  dir: string,
  depth: number,
  excludedDirs: Set<string>,
  showSize: boolean,
  currentDepth = 0,
  parentPrefix = "",
): Promise<string> {
  // Read the contents of the directory
  const contents = await fs.readdir(dir, { withFileTypes: true });

  // Filter out hidden files and excluded directories
  const filteredContents = contents.filter((item) => !item.name.startsWith(".") && !excludedDirs.has(item.name));

  let tree = "";
  // loop through each item in the directory, each item is a file or a directory
  for (let i = 0; i < filteredContents.length; i++) {
    const item = filteredContents[i];
    const isLast = i === filteredContents.length - 1; // check if the current item is last in the array
    const itemPrefix = isLast ? "└── " : "├── "; // Determine the prefix for the current item
    const nextPrefix = isLast ? "    " : "│   "; // Determine the prefix for the next level

    const itemPath = path.join(dir, item.name);

    let sizeString = "";
    if (showSize) {
      const stats = await fs.stat(itemPath);
      const itemSize = formatSize(stats.size);
      sizeString = ` (${itemSize})`;
    }

    if (item.isDirectory() && (currentDepth < depth - 1 || depth === -1)) {
      // Recursively generate the tree for subdirectories
      const subTree = await generateTree(
        itemPath,
        depth,
        excludedDirs,
        showSize,
        currentDepth + 1,
        parentPrefix + nextPrefix,
      );
      tree += `${parentPrefix}${itemPrefix}${item.name}${sizeString}\n${subTree}`;
    } else {
      tree += `${parentPrefix}${itemPrefix}${item.name}${sizeString}\n`;
    }
  }

  return tree;
}

/**
 * The main command component for the Better Tree Tool extension.
 * This component handles the generation, display, and editing of directory trees.
 *
 * @param props.arguments - Command arguments including optional depth and exclude parameters.
 */
export default function Command(props: { arguments: CommandArguments }) {
  // State variables
  const [tree, setTree] = useState<string | null>(null); // Stores the generated tree
  const [isLoading, setIsLoading] = useState(true); // Indicates if the tree is being generated
  const [error, setError] = useState<string | null>(null); // Stores any error messages
  const [isEditing, setIsEditing] = useState(false); // Indicates if the tree is being edited
  const [editedTree, setEditedTree] = useState<string>(""); // Stores the edited version of the tree

  // Effect hook to generate the tree when the component mounts or when arguments change
  useEffect(() => {
    async function fetchTree() {
      try {
        // Get the selected items from Finder
        const selectedItems = await getSelectedFinderItems();
        if (selectedItems.length === 0) {
          throw new Error("No directory selected. Please select a directory in Finder.");
        }

        const selectedDir = selectedItems[0].path; // gets the path of the first selected item

        // Get user preferences and command arguments
        const preferences = getPreferenceValues<Preferences>();
        const defaultDepth = parseInt(preferences.defaultDepth) || 2;
        const depth = props.arguments.depth ? parseInt(props.arguments.depth) : defaultDepth;

        // Combine excluded directories from preferences and command arguments
        const defaultExcludedDirs = new Set(preferences.defaultExcludedDirs?.split(",").map((dir) => dir.trim()) || []);
        const argumentExcludedDirs = props.arguments.exclude
          ? new Set(props.arguments.exclude.split(",").map((dir) => dir.trim()))
          : new Set<string>();
        const excludedDirs = new Set([...defaultExcludedDirs, ...argumentExcludedDirs]);

        const stats = await fs.stat(selectedDir);
        if (!stats.isDirectory()) {
          throw new Error("Selected item is not a directory. Please select a directory in Finder.");
        }

        const showSize = props.arguments.showSize?.toLowerCase() !== "false"; // Default to true if not specified

        let rootSizeString = "";
        if (showSize) {
          const stats = await fs.stat(selectedDir);
          const rootSize = formatSize(stats.size);
          rootSizeString = ` (${rootSize})`;
        }

        const generatedTree = `${path.basename(selectedDir)}${rootSizeString}\n${await generateTree(selectedDir, depth, excludedDirs, showSize)}`;
        setTree(generatedTree);
        setEditedTree(generatedTree);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    }

    fetchTree();
  }, [props.arguments.depth, props.arguments.exclude, props.arguments.showSize]);

  // Effect hook to show an error toast when an error occurs
  useEffect(() => {
    if (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: error,
      });
    }
  }, [error]);

  // Prepare the markdown content for display
  const markdown = tree
    ? `# Directory Tree\n\n\`\`\`\n${tree}\n\`\`\`\n\nTip: Use the Actions menu to edit the tree or open preferences.`
    : "# Generating tree...";

  // Render the editing form when in editing mode
  if (isEditing) {
    return (
      <Form
        actions={
          <ActionPanel>
            <Action.SubmitForm
              title="Save Edits"
              onSubmit={(values) => {
                setTree(values.editedTree);
                setEditedTree(values.editedTree);
                setIsEditing(false);
              }}
            />
            <Action title="Cancel" onAction={() => setIsEditing(false)} />
          </ActionPanel>
        }
      >
        <Form.TextArea
          id="editedTree"
          title="Edit Tree"
          defaultValue={editedTree.replace(/<#[0-9A-Fa-f]{6}>|<\/#>/g, "")}
        />
      </Form>
    );
  }

  // Render the main detail view with the generated tree
  return (
    <Detail
      markdown={markdown}
      isLoading={isLoading}
      actions={
        <ActionPanel>
          {tree && (
            <>
              <Action.CopyToClipboard
                content={tree ? tree.replace(/<#[0-9A-Fa-f]{6}>|<\/#>/g, "") : ""}
                title="Copy Tree"
                shortcut={{ modifiers: ["cmd"], key: "c" }}
              />

              <Action
                title="Edit Tree"
                onAction={() => setIsEditing(true)}
                shortcut={{ modifiers: ["cmd"], key: "e" }}
              />
            </>
          )}
          <Action
            title="Open Extension Preferences"
            onAction={openExtensionPreferences}
            shortcut={{ modifiers: ["cmd", "shift"], key: "," }}
          />
        </ActionPanel>
      }
    />
  );
  
}
