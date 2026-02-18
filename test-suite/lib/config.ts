import 'dotenv/config';
import type { BrowserContextOptions } from '@playwright/test';

type SearchParams = Record<string, string | number | boolean>;

export const HOST = process.env.PC_HOST ?? 'playcanvas.com';
export const LOGIN_HOST = process.env.PC_LOGIN_HOST ?? 'login.playcanvas.com';
export const LAUNCH_HOST = process.env.PC_LAUNCH_HOST ?? 'launch.playcanvas.com';
export const LOCAL_FRONTEND = process.env.PC_LOCAL_FRONTEND === 'true';

export const AUTH_STATE: BrowserContextOptions['storageState'] = (() => {
    const parts = HOST.split('.');
    if (parts.length < 2) {
        throw new Error(`Invalid HOST: ${HOST}`);
    }
    return {
        cookies: [{
            name: process.env.PC_COOKIE_NAME ?? 'pc_auth',
            value: process.env.PC_COOKIE_VALUE ?? '',
            domain: `.${parts.slice(-2).join('.')}`,
            path: '/',
            expires: -1,
            httpOnly: true,
            secure: true,
            sameSite: 'Lax'
        }],
        origins: []
    };
})();

const queryString = (params: SearchParams) => {
    const preset = [];
    if (LOCAL_FRONTEND) {
        preset.push('use_local_frontend');
    }
    return preset.concat(Object.entries(params).map(([key, value]) => {
        if (value === undefined) {
            return key;
        }
        return `${key}=${value}`;
    })).join('&');
};

export const editorBlankUrl = (params: SearchParams = {}) => {
    return `https://${HOST}/editor?${queryString(params)}`;
};
export const editorUrl = (projectId: number, params: SearchParams = {}) => {
    return `https://${HOST}/editor/project/${projectId}?${queryString(params)}`;
};
export const editorSceneUrl = (sceneId: number, params: SearchParams = {}) => {
    return `https://${HOST}/editor/scene/${sceneId}?${queryString(params)}`;
};
export const codeEditorUrl = (projectId: number, params: SearchParams = {}) => {
    return `https://${HOST}/editor/code/${projectId}?${queryString(params)}`;
};
export const launchSceneUrl = (sceneId: number, params: SearchParams = {}) => {
    return `https://${LAUNCH_HOST}/${sceneId}?${queryString(params)}`;
};
