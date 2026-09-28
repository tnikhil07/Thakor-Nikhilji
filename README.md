# Nikhilji Thakor — Portfolio Testing Package

This package is prepared for the `portfolio-testing` GitHub branch.

## Important
- It does **not** include or replace your existing binary assets. Keep these existing files/folders in the branch:
  - `profile-photo.png`
  - `intro-video.mp4`
  - `resume.pdf`
  - `certificates/`
- Upload/replace only the files and folders included in this package.
- Do NOT upload these changes to `main` yet.
- The modular sections are loaded by JavaScript, so test through GitHub Pages or a local web server (for example VS Code Live Server), not by double-clicking `index.html`.

## Structure
```
index.html
css/
  style.css
  custom.css
js/
  main.js
  custom.js
sections/
  about.html
  education.html
  skills.html
  projects.html
  experience.html
  certificates.html
  contact.html
```

## Optional protection settings
`js/custom.js` contains settings for left-click, right-click, F12, DevTools shortcuts, text selection, and sidebar hiding. They are currently **OFF** so the testing site remains fully functional.
