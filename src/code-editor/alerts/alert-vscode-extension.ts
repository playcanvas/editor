import { Container, Label, Button } from '@playcanvas/pcui';

const LOCALSTORAGE_KEY = 'ide:vscode-ext-banner';
const EXT_URL = 'https://marketplace.visualstudio.com/items?itemName=playcanvas.playcanvas';
const VSCODE_ICON = /* html */`
    <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <mask id="vs-m" mask-type="alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M70.912 99.317a6.223 6.223 0 004.874-.637l20.17-10.482A6.25
                6.25 0 0099.2 82.6V17.4a6.25 6.25 0 00-3.245-5.597L75.786 1.32a6.226 6.226 0 00-7.106 1.014L29.4
                38.468 12.223 25.2a4.162 4.162 0 00-5.318.252L1.378 30.55a4.168 4.168 0 00-.004 6.155L32.6 50 1.374
                63.295a4.168 4.168 0 00.004 6.155l5.527 5.098a4.162 4.162 0 005.318.252L29.4 61.532 68.68
                97.666a6.217 6.217 0 002.232 1.651zM75.015 27.3L45.1 50l29.915 22.7V27.3z" fill="white"/>
        </mask>
        <g mask="url(#vs-m)">
            <path d="M96.461 10.796L75.857.876a6.23 6.23 0 00-7.107 1.207L1.299 63.583a4.17 4.17 0 00.004
                6.162l5.51 5.009a4.16 4.16 0 005.321.236L93.361 13.37C96.086 11.303 100 13.246 100
                16.667v-.24a6.25 6.25 0 00-3.539-5.63z" fill="#0065A9"/>
            <path d="M96.461 89.204l-20.604 9.92a6.23 6.23 0 01-7.107-1.207L1.299 36.417a4.17 4.17 0
                01.004-6.162l5.51-5.009a4.16 4.16 0 015.321-.236L93.361 86.63C96.086 88.697 100 86.754 100
                83.333v.24a6.25 6.25 0 01-3.539 5.63z" fill="#007ACC"/>
            <path d="M75.857 99.126a6.23 6.23 0 01-7.107-1.207c2.306 2.306 6.25.673 6.25-2.59V4.672c0-3.262-3.944
                -4.896-6.25-2.59a6.23 6.23 0 017.107-1.208l20.6 9.907A6.25 6.25 0 01100 16.413v67.174a6.25 6.25 0
                01-3.543 5.632l-20.6 9.907z" fill="#1F9CF0"/>
        </g>
    </svg>`;

editor.once('load', () => {
    if (editor.call('localStorage:get', LOCALSTORAGE_KEY)) {
        return;
    }

    const root = editor.call('layout.root');
    const container = new Container({ class: 'vscode-ext-banner' });

    const label = new Label({ text: 'Accelerate your workflow with Cursor, Codex, and Claude Code using the VSCode extension' });
    container.append(label);

    const icon = new Label({
        class: 'ide-icons',
        unsafe: true,
        text: VSCODE_ICON
    });
    container.append(icon);

    const btnInstall = new Button({ class: 'install', text: 'Install Extension' });
    btnInstall.on('click', () => window.open(EXT_URL, '_blank'));
    container.append(btnInstall);

    const btnClose = new Button({ class: 'close', icon: 'E132' });
    btnClose.on('click', () => {
        editor.call('localStorage:set', LOCALSTORAGE_KEY, true);
        container.hidden = true;
        root.class?.remove('has-ext-banner');
    });
    container.append(btnClose);

    root.prepend(container);
    root.class?.add('has-ext-banner');
});
