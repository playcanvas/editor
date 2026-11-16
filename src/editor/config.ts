import type { EditorConfig } from '@/editor-api';

import { decodeProject } from '../common/utils';

export const config = window.config as EditorConfig;

// the server renders the project's name and description html-escaped
decodeProject(config.project);
