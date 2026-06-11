import { expect } from 'chai';
import { describe, it } from 'mocha';

import { formatRelativeDate, formatDayGroup, summarizeDiff, typeLabel } from '../../src/editor/pickers/version-control/vc-helpers';

describe('vc-helpers', () => {
    const now = new Date('2026-06-10T15:00:00');

    describe('formatRelativeDate', () => {
        it('returns "just now" under a minute', () => {
            expect(formatRelativeDate(new Date('2026-06-10T14:59:30'), now)).to.equal('just now');
        });

        it('returns minutes ago same day', () => {
            expect(formatRelativeDate(new Date('2026-06-10T14:15:00'), now)).to.equal('45 minutes ago');
            expect(formatRelativeDate(new Date('2026-06-10T14:59:00'), now)).to.equal('1 minute ago');
        });

        it('returns hours ago same day', () => {
            expect(formatRelativeDate(new Date('2026-06-10T12:00:00'), now)).to.equal('3 hours ago');
            expect(formatRelativeDate(new Date('2026-06-10T14:00:00'), now)).to.equal('1 hour ago');
        });

        it('returns absolute date for other days', () => {
            expect(formatRelativeDate(new Date('2026-06-08T10:00:00'), now)).to.equal('Jun 8, 2026');
        });
    });

    describe('formatDayGroup', () => {
        it('returns Today for same day', () => {
            expect(formatDayGroup(new Date('2026-06-10T01:00:00'), now)).to.equal('Today');
        });

        it('returns weekday, month day, year otherwise', () => {
            expect(formatDayGroup(new Date('2026-06-08T10:00:00'), now)).to.equal('Mon, Jun 8, 2026');
        });
    });

    describe('typeLabel', () => {
        it('pluralizes singular types', () => {
            expect(typeLabel('asset')).to.equal('assets');
            expect(typeLabel('scene')).to.equal('scenes');
        });

        it('keeps already-plural types', () => {
            expect(typeLabel('settings')).to.equal('settings');
        });
    });

    describe('summarizeDiff', () => {
        it('handles empty diff', () => {
            expect(summarizeDiff({ numConflicts: 0 })).to.deep.equal({ total: 0, groups: [] });
        });

        it('groups by item type with status from missing flags', () => {
            const diff = {
                numConflicts: 3,
                conflicts: [
                    { itemType: 'scene', itemName: 'Terrain', data: [{}] },
                    { itemType: 'asset', itemName: 'water.glsl', data: [{ missingInDst: true }] },
                    { itemType: 'asset', itemName: 'old.png', data: [{ missingInSrc: true }] }
                ]
            };
            expect(summarizeDiff(diff)).to.deep.equal({
                total: 3,
                groups: [
                    { type: 'scene', items: [{ name: 'Terrain', status: 'modified' }] },
                    {
                        type: 'asset',
                        items: [
                            { name: 'water.glsl', status: 'added' },
                            { name: 'old.png', status: 'deleted' }
                        ]
                    }
                ]
            });
        });

        it('title-cases settings item names', () => {
            const diff = {
                numConflicts: 1,
                conflicts: [{ itemType: 'settings', itemName: 'project settings', data: [{}] }]
            };
            expect(summarizeDiff(diff).groups[0].items[0].name).to.equal('Project Settings');
        });

        it('treats both missing flags as added', () => {
            const diff = {
                numConflicts: 1,
                conflicts: [
                    { itemType: 'asset', itemName: 'both.png', data: [{ missingInSrc: true, missingInDst: true }] }
                ]
            };
            expect(summarizeDiff(diff).groups[0].items[0].status).to.equal('added');
        });
    });
});
