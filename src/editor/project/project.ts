import { backend, UNSUPPORTED } from '@/common/backend';
import { Defer } from '@/common/defer';
import { supports, service } from '@/common/supports';
import { config } from '@/editor/config';

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
            .appList('starterkit')
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
        if (!supports('projectDeletion')) {
            return;
        }
        service('projectDeletion')
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
        const partSize = 20 * 1024 * 1024; // 20Mb per part
        const partsTotal = Math.ceil(file.size / partSize);

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

        let partNumber = 1;
        const urls = urlsData.signedUrls;

        // upload file chunk by chunk
        const promises = [];
        let completedParts = 0;
        for (let start = 0; start < file.size; start += partSize) {
            const end = Math.min(start + partSize, file.size);
            const blob = file.slice(start, end); // Create a part-sized blob
            const signedUrl = urls[partNumber - 1];

            // Upload the file to S3 using the pre-signed URL
            promises.push(
                backend()
                    .transport.fetch(signedUrl, {
                        method: 'PUT',
                        body: blob,
                        headers: {
                            'Content-Type': 'application/zip'
                        }
                    })
                    .then((response) => {
                        completedParts++; // Increment the number of completed parts
                        const progress = completedParts / urls.length; // Calculate progress as a fraction
                        progressHandler(progress); // Update the progress
                        return response;
                    })
            );

            partNumber++;
        }

        // Wait for all parts to be uploaded
        const results = await Promise.all(promises);

        // get etags from the results
        const parts = [];
        for (let i = 0; i < results.length; i++) {
            const etag = results[i].headers.get('ETag');
            const cleanEtag = etag.replace(/^"|"$/g, '');

            parts.push({ PartNumber: i + 1, ETag: cleanEtag });
        }

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
        const service = backend().projectManagement;
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
            const service = backend().projectManagement;
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
            const service = backend().projectManagement;
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
            const service = backend().projectManagement;
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
            const service = backend().projectManagement;
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
