import Markdown from "react-markdown";
import { Converter } from "showdown";
import { saveAs } from "file-saver";
import { Menu, MenuItem, MenuButton, SubMenu } from "@szhsin/react-menu";
import { GoShare, GoSun, GoMoon } from "react-icons/go";
import { useClipboard } from "use-clipboard-copy";
// import { Tooltip } from "react-tooltip";
import { asBlob } from "html-docx-js-typescript";

import styles from "./index.module.css";
import { useApp } from "../../App";
import { useMemo } from "react";

const markdownConverter = new Converter();

export default function MarkdownViewPage({
  title,
  markdownContent,
}: {
  title: string;
  markdownContent: string;
}) {
  return (
    <>
      <TopNav title={title} markdownContent={markdownContent} />
      <main className={styles.contentWrapper}>
        <article className={styles.markdownContent}>
          <Markdown>{markdownContent}</Markdown>
        </article>
      </main>
    </>
  );
}

function TopNav({
  title,
  markdownContent,
}: {
  title: string;
  markdownContent: string;
}) {
  const clipboard = useClipboard();
  const { darkMode, setDarkMode } = useApp();

  const markdownHtml = useMemo(
    () =>
      `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Notes</title></head><body>${markdownConverter.makeHtml(
        markdownContent
      )}</body>`,
    [markdownContent]
  );

  return (
    <>
      {/* TODO: Use router data to construct clipboard link rather than `window.location` */}
      <input
        type="text"
        value={window.location.href}
        ref={clipboard.target}
        readOnly
        hidden
      />
      <nav className={styles.topNav}>
        <div className={styles.topNavInner}>
          <button
            className={styles.iconButton}
            title={darkMode ? "Light Mode" : "Dark Mode"}
            // data-tooltip-id="tooltip_TopNav"
            // data-tooltip-content={darkMode ? "Light Mode" : "Dark Mode"}
            // data-tooltip-place="bottom"
            onClick={() => setDarkMode((prev) => !prev)}
          >
            {darkMode ? <GoSun /> : <GoMoon />}
          </button>
          <h1>{title}</h1>
          <Menu
            direction="bottom"
            theming={darkMode ? "dark" : undefined}
            menuButton={
              <MenuButton
                className={styles.iconButton}
                aria-label="Share"
                // data-tooltip-id="tooltip_TopNav"
                // data-tooltip-content="Share"
                // data-tooltip-place="bottom"
              >
                <GoShare />
              </MenuButton>
            }
            transition
          >
            <MenuItem onClick={() => clipboard.copy()}>Copy Link</MenuItem>
            <SubMenu label="Download" direction="left">
              <MenuItem
                onClick={async () =>
                  saveAs((await asBlob(markdownHtml)) as Blob, "notes.docx")
                }
              >
                Microsoft Word (.docx)
              </MenuItem>
              <MenuItem
                onClick={() => saveAs(new Blob([markdownContent]), "notes.md")}
              >
                Markdown (.md)
              </MenuItem>
              <MenuItem onClick={() => saveAs(markdownHtml, "notes.html")}>
                Web Page (.html)
              </MenuItem>
            </SubMenu>
          </Menu>
        </div>
        {/* <Tooltip id="tooltip_TopNav" /> */}
      </nav>
    </>
  );
}
