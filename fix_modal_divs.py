def fix():
    with open('frontend/src/components/ppk/DocPreviewModal.jsx') as f:
        content = f.read()

    # count opening and closing div tags
    open_divs = content.count("<div")
    close_divs = content.count("</div")

    print(f"Open divs: {open_divs}")
    print(f"Close divs: {close_divs}")

    if open_divs > close_divs:
        # Add missing close divs before the createPortal closing paren
        diff = open_divs - close_divs
        missing = "</div>\n" * diff
        
        # Replace `</div>,\n    document.body` with `</div>\n` * diff + `</div>,\n    document.body`
        content = content.replace("    </div>,\n    document.body\n  );\n  );\n}", missing + "    document.body\n  );\n}")
        
        with open('frontend/src/components/ppk/DocPreviewModal.jsx', 'w') as f:
            f.write(content)
        print("Fixed missing closing divs")

fix()
