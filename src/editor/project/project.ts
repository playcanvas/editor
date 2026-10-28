import { backend, UNSUPPORTED } from '@/common/backend';
import { Defer } from '@/common/defer';
import { supports, service } from '@/common/supports';
import { config } from '@/editor/config';

const UPLOAD_PART_SIZE = 20 * 1024 * 1024;
const UPLOAD_CONCURRENCY = 4;

editor.once('load', () => {
    // Create a project from data
    editor.method(
        'projects:create',
        (data: Record<string, unknown>, success?: (response: unknown) => void, errorFn?: (err: unknown) => void) => {
            // Prepare project data for API call
            const keys = ['name', 'description', 'private', 'private_assets', 'fork_from', 'owner', 'settings'];
            const apiData: any = {};
            keys.forEach((key: string) => {
                apiData[key] = data[key];
            });

            const service = backend().projectCreation;
            if (!service) {
                errorFn?.(UNSUPPORTED);
                return;
            }

            service
                .projectCreate(apiData)
                .on('load', (_status: number, response: unknown) => {
                    if (success) {
                        success(response);
                    }
                })
                .on('error', (_status: number, err: unknown) => {
                    if (errorFn) {
                        errorFn(err);
                    }
                });
        }
    );

    // Load a single project from id
    editor.method(
        'projects:getOne',
        (projectId: string, success?: (data: unknown) => void, errorFn?: (err: unknown) => void) => {
            const request = editor.api.globals.rest.projects
                .projectGet({ projectId })
                .on('load', (_status: number, data: unknown) => {
                    if (success) {
                        success(data);
                    }
                })
                .on('error', (_status: number, err: unknown) => {
                    if (errorFn) {
                        errorFn(err);
                    }
                });

            return request;
        }
    );

    // Load current project
    editor.method('projects:getCurrent', (success?: (data: unknown) => void) => {
        editor.api.globals.rest.projects
            .projectGet({ projectId: config.project.id })
            .on('load', (_status: number, data: unknown) => {
                if (success) {
                    success(data);
                }
            });
    });

    // Loads all the user's projects
    editor.method('projects:list', (id: string, view: string) => {
        return new Promise((resolve, reject) => {
            const service = backend().projectList;
            if (!service) {
                reject(UNSUPPORTED);
                return;
            }

            service
                .userProjects(id, view)
                .on('load', (_status: number, response: unknown) => {
                    resolve(response);
                })
                .on('error', (_status: number, error: unknown) => {
                    reject(error);
                });
        });
    });

    // Loads all the starter kits
    editor.method('projects:listStarterKits', (success?: (data: unknown) => void) => {
        if (!supports('projectList')) {
            return;
        }
        service('projectList')
            .appStarterKits()
            .on('load', (_status: number, data: { result: unknown }) => {
                if (success) {
                    success(data.result);
                }
            });
    });

    // Save a specified project
    editor.method(
        'projects:saveSettings',
        (
            project: { id: string; [key: string]: unknown },
            success?: (response: unknown) => void,
            errorFn?: (error: unknown) => void
        ) => {
            const { id, ...data } = project;
            editor.api.globals.rest.projects
                .projectUpdate({
                    projectId: id,
                    ...data
                })
                .on('load', (_status: number, response: unknown) => {
                    if (success) {
                        success(response);
                    }
                })
                .on('error', (_status: number, error: unknown) => {
                    if (errorFn) {
                        errorFn(error);
                    }
                });
        }
    );

    // Delete specified project
    editor.method('projects:delete', (projectId, success) => {
        if (!supports('projectManagement')) {
            return;
        }
        service('projectManagement')
            .projectDelete({ projectId })
            .on('load', () => {
                if (success) {
                    success();
                }
            });
    });

    // get job status
    editor.method('projects:getJobStatus', (jobId: string) => {
        return new Promise((resolve, reject) => {
            const service = backend().jobs;
            if (!service) {
                reject(UNSUPPORTED);
                return;
            }

            service
                .jobGet({ jobId })
                .on('load', (_status: number, response: unknown) => {
                    resolve(response);
                })
                .on('error', (_status: number, error: unknown) => {
                    reject(error);
                });
        });
    });

    // Export specified project
    editor.method(
        'projects:export',
        (
            projectId: string,
            branchId?: string,
            success?: (result: unknown) => void,
            errorFn?: (error: unknown) => void
        ) => {
            const service = backend().projectExport;
            if (!service) {
                errorFn?.(UNSUPPORTED);
                return;
            }

            service
                .projectExport({ projectId, branchId })
                .on('load', (status, result) => {
                    if (success) {
                        success(result);
                    }
                })
                .on('error', (error) => {
                    if (errorFn) {
                        errorFn(error);
                    }
                });
        }
    );

    // Upload specified export
    editor.method('projects:uploadExport', async (file, progressHandler) => {
        const service = backend().projectImport;
        if (!service) {
            throw new Error(UNSUPPORTED);
        }

        // start upload
        const partsTotal = Math.ceil(file.size / UPLOAD_PART_SIZE);

        const startResponse = await service.uploadStart({
            filename: file.name
        });

        const uploadId = startResponse.uploadId;
        const key = startResponse.key;

        const urlsData = await service.uploadUrls({
            uploadId: uploadId,
            parts: partsTotal,
            key: key
        });
        const urls = urlsData.signedUrls;

        // upload the file in parts, a few at a time; progress counts the bytes sent, not finished parts
        const loaded: number[] = new Array(partsTotal).fill(0);
        const etags: string[] = [];
        let next = 0;
        const worker = async () => {
            while (next < partsTotal) {
                const i = next++;
                const blob = file.slice(i * UPLOAD_PART_SIZE, Math.min((i + 1) * UPLOAD_PART_SIZE, file.size));
                etags[i] = await new Promise<string>((resolve, reject) => {
                    const xhr = backend().transport.xhr();
                    xhr.open('PUT', urls[i]);
                    xhr.setRequestHeader('Content-Type', 'application/zip');
                    xhr.upload.onprogress = (e) => {
                        loaded[i] = e.loaded;
                        progressHandler(loaded.reduce((a, b) => a + b, 0) / file.size);
                    };
                    xhr.onload = () =>
                        xhr.status >= 200 && xhr.status < 300
                            ? resolve(xhr.getResponseHeader('ETag'))
                            : reject(new Error(`Upload failed (${xhr.status})`));
                    xhr.onerror = () => reject(new Error('Upload failed'));
                    xhr.send(blob);
                });
                loaded[i] = blob.size;
            }
        };
        await Promise.all(Array.from({ length: Math.min(UPLOAD_CONCURRENCY, partsTotal) }, worker));
        progressHandler(1);

        // get etags from the results
        const parts = etags.map((etag, i) => ({ PartNumber: i + 1, ETag: etag.replace(/^"|"$/g, '') }));

        // Complete the upload
        await service.uploadComplete({
            uploadId: uploadId,
            parts: parts,
            key: key
        });

        // return s3 key to continue process of importing project
        return { s3Key: key };
    });

    // Imports specified project
    editor.method('projects:importNew', (exportUrl, ownerId) => {
        return new Promise((resolve, reject) => {
            const service = backend().projectImport;
            if (!service) {
                reject(UNSUPPORTED);
                return;
            }

            service
                .projectImport({
                    export_url: exportUrl,
                    owner: ownerId
                })
                .on('load', (_status: number, response: unknown) => {
                    resolve(response);
                })
                .on('error', (_status: number, error: unknown) => {
                    reject(error);
                });
        });
    });

    // Unlocks locked project
    editor.method('projects:unlockOne', (projectId, success, errorFn) => {
        const service = backend().projectUnlock;
        if (!service) {
            errorFn?.(UNSUPPORTED);
            return;
        }

        service
            .projectUnlock(projectId)
            .on('load', (status, result) => {
                if (success) {
                    success();
                }
            })
            .on('error', (_status: number, err: unknown) => {
                if (errorFn) {
                    errorFn(err);
                }
            });
    });

    // Transfers a specified project
    editor.method('projects:transfer', (projectId, newOwnerId) => {
        return new Promise((resolve, reject) => {
            const service = backend().projectTransfer;
            if (!service) {
                reject(UNSUPPORTED);
                return;
            }

            service
                .projectTransfer(projectId, {
                    owner_id: newOwnerId
                })
                .on('load', (_status: number, response: unknown) => {
                    resolve(response);
                })
                .on('error', (_status: number, error: unknown) => {
                    reject(error);
                });
        });
    });

    // Accepts transferred project
    editor.method('projects:acceptTransfer', (projectId: string) => {
        return new Promise((resolve, reject) => {
            const service = backend().projectTransfer;
            if (!service) {
                reject(UNSUPPORTED);
                return;
            }

            service
                .projectAcceptTransfer(projectId)
                .on('load', (_status: number, response: unknown) => {
                    resolve(response);
                })
                .on('error', (_status: number, error: unknown) => {
                    reject(error);
                });
        });
    });

    // Decline transferred project
    editor.method(
        'projects:declineTransfer',
        (projectId: string, success?: (response: unknown) => void, errorFn?: (err: unknown) => void) => {
            const service = backend().projectTransfer;
            if (!service) {
                errorFn?.(UNSUPPORTED);
                return;
            }

            service
                .projectDeclineTransfer(projectId)
                .on('load', (_status: number, response: unknown) => {
                    if (success) {
                        success(response);
                    }
                })
                .on('error', (err) => {
                    if (errorFn) {
                        errorFn(err);
                    }
                });
        }
    );

    // Watches a particular project
    editor.method(
        'projects:watch',
        (projectId: string, success?: (response: unknown) => void, errorFn?: (err: unknown) => void) => {
            const service = backend().projectFollowing;
            if (!service) {
                errorFn?.(UNSUPPORTED);
                return;
            }

            service
                .watchCreate({
                    scope: {
                        type: 'project',
                        id: projectId
                    }
                })
                .on('load', (_status: number, response: unknown) => {
                    if (success) {
                        success(response);
                    }
                })
                .on('error', (err) => {
                    if (errorFn) {
                        errorFn(err);
                    }
                });
        }
    );

    // Unwatches a particular project
    editor.method(
        'projects:unwatch',
        (watchId: string, success?: (response: unknown) => void, errorFn?: (err: unknown) => void) => {
            const service = backend().projectFollowing;
            if (!service) {
                errorFn?.(UNSUPPORTED);
                return;
            }

            service
                .watchDelete(watchId)
                .on('load', (_status: number, response: unknown) => {
                    if (success) {
                        success(response);
                    }
                })
                .on('error', (err) => {
                    if (errorFn) {
                        errorFn(err);
                    }
                });
        }
    );

    // Stars a particular project
    editor.method(
        'projects:star',
        (
            starType: string,
            projectId: string,
            success?: (response: unknown) => void,
            errorFn?: (err: unknown) => void
        ) => {
            const service = backend().projectFollowing;
            if (!service) {
                errorFn?.(UNSUPPORTED);
                return;
            }

            service
                .starCreate({
                    scope: { type: starType, id: projectId }
                })
                .on('load', (_status: number, response: unknown) => {
                    if (success) {
                        success(response);
                    }
                })
                .on('error', (err) => {
                    if (errorFn) {
                        errorFn(err);
                    }
                });
        }
    );

    // Unstars a particular project
    editor.method(
        'projects:unstar',
        (starId: string, success?: (response: unknown) => void, errorFn?: (err: unknown) => void) => {
            const service = backend().projectFollowing;
            if (!service) {
                errorFn?.(UNSUPPORTED);
                return;
            }

            service
                .starDelete(starId)
                .on('load', (_status: number, response: unknown) => {
                    if (success) {
                        success(response);
                    }
                })
                .on('error', (err) => {
                    if (errorFn) {
                        errorFn(err);
                    }
                });
        }
    );

    // Fork project
    editor.method(
        'projects:fork',
        (
            data: Record<string, unknown>,
            success?: (promise: Promise<unknown>) => void,
            errorFn?: (promise: Promise<unknown>) => void
        ) => {
            const deferred = new Defer();

            const service = backend().projectCreation;
            if (!service) {
                deferred.reject(UNSUPPORTED);
                errorFn?.(deferred.promise);
                return;
            }

            service
                .projectCreate(data)
                .on('load', (_status: number, response: unknown) => {
                    deferred.resolve(response);
                    if (success) {
                        success(deferred.promise);
                    }
                })
                .on('error', (status: number, response: unknown) => {
                    if (status > 0) {
                        deferred.reject(`${status}: ${response}`);
                    }
                    if (errorFn) {
                        errorFn(deferred.promise);
                    }
                });
        }
    );

    // Get project activity
    editor.method('projects:activity', (projectId, success, errorFn) => {
        const service = backend().projectList;
        if (!service) {
            errorFn?.(UNSUPPORTED);
            return;
        }

        service
            .projectActivity(projectId)
            .on('load', (_status: number, data: unknown) => {
                if (success) {
                    success(data);
                }
            })
            .on('error', (err: unknown) => {
                if (errorFn) {
                    errorFn(err);
                }
            });
    });

    // Saves specified data to server
    editor.method(
        'projects:save',
        (
            project: { id: string },
            data: Record<string, unknown>,
            success?: (response: unknown) => void,
            errorFn?: (err: unknown) => void
        ) => {
            editor.api.globals.rest.projects
                .projectUpdate({
                    projectId: project.id,
                    ...data
                })
                .on('load', (_status: number, response: unknown) => {
                    if (success) {
                        success(response);
                    }
                })
                .on('error', (_status: number, err: unknown) => {
                    if (errorFn) {
                        errorFn(err);
                    }
                });
        }
    );

    // Gets list of project collaborators
    editor.method(
        'projects:getCollaborators',
        (
            project: { id: string },
            success?: (result: unknown) => void,
            errorFn?: (status: number, error: unknown) => void
        ) => {
            const service = backend().teamList;
            if (!service) {
                errorFn?.(0, UNSUPPORTED);
                return;
            }

            service
                .projectCollabList(project.id)
                .on('load', (_status: number, data: unknown) => {
                    if (success) {
                        success(data.result);
                    }
                })
                .on('error', (status: number, error: unknown) => {
                    if (errorFn) {
                        errorFn(status, error);
                    }
                });
        }
    );

    // Gets list of invitations to a project
    editor.method(
        'projects:invitations',
        (options: Record<string, unknown>, success?: (result: unknown) => void, errorFn?: (error: unknown) => void) => {
            const service = backend().teamList;
            if (!service) {
                errorFn?.(UNSUPPORTED);
                return;
            }

            service
                .invitationList(options)
                .on('load', (_status: number, data: unknown) => {
                    if (success) {
                        success(data.result);
                    }
                })
                .on('error', (_status: number, error: unknown) => {
                    if (errorFn) {
                        errorFn(error);
                    }
                });
        }
    );

    // Creates invitation for project
    editor.method(
        'projects:createInvitation',
        (
            project: { owner: string; name: string },
            email: string,
            permission: string,
            success?: (data: unknown) => void,
            errorFn?: (error: unknown) => void
        ) => {
            const service = backend().teamManagement;
            if (!service) {
                errorFn?.(UNSUPPORTED);
                return;
            }

            service
                .invitationCreate({
                    project_owner: project.owner,
                    project_name: project.name,
                    email: email,
                    permission: permission
                })
                .on('load', (_status: number, data: unknown) => {
                    if (success) {
                        success(data);
                    }
                })
                .on('error', (_status: number, error: unknown) => {
                    if (errorFn) {
                        errorFn(error);
                    }
                });
        }
    );

    // Deletes invitation for project
    editor.method(
        'projects:deleteInvitation',
        (invitation: { key: string }, success?: () => void, errorFn?: () => void) => {
            const service = backend().teamManagement;
            if (!service) {
                errorFn?.();
                return;
            }

            service
                .invitationDelete(invitation.key)
                .on('load', () => {
                    if (success) {
                        success();
                    }
                })
                .on('error', () => {
                    if (errorFn) {
                        errorFn();
                    }
                });
        }
    );

    editor.method(
        'projects:setPrimaryApp',
        (appId: string, success?: (response: unknown) => void, errorFn?: (err: unknown) => void) => {
            const prevPrimary = config.project.primaryApp;
            config.project.primaryApp = parseInt(appId, 10);
            editor.call(
                'projects:save',
                config.project,
                {
                    primary_app: config.project.primaryApp
                },
                success,
                (err) => {
                    config.project.primaryApp = prevPrimary;
                    errorFn(err);
                }
            );
        }
    );

    editor.on('messenger:project.primary_app', (data) => {
        const primaryApp = parseInt(data.project.primary_app, 10);
        const prev = config.project.primaryApp;

        config.project.primaryApp = primaryApp;

        editor.emit('projects:primaryApp', primaryApp, prev);
    });
});
