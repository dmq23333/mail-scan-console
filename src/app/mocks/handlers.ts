import { http, HttpResponse } from 'msw';
import { ApplicationSearchParams, ApplicationUpdateRequest, JobApplication } from '../models/application.model';
import { initialApplications } from './data/applications';

let applications: JobApplication[] = structuredClone(initialApplications);

function applyFilters(data: JobApplication[], params: URLSearchParams): JobApplication[] {
    const filters: ApplicationSearchParams = {
        appliedAfter: params.get('appliedAfter') ?? undefined,
        companyName: params.get('companyName') ?? undefined,
        offerStatus: (params.get('offerStatus') as ApplicationSearchParams['offerStatus']) ?? undefined,
        resumeVersion: params.get('resumeVersion') ?? undefined,
        platform: params.get('platform') ?? undefined,
    };

    return data.filter((item) => {
        if (filters.appliedAfter) {
            const cutoff = new Date(filters.appliedAfter).getTime();
            const applied = item.appliedDate ? new Date(item.appliedDate).getTime() : 0;
            if (!Number.isNaN(cutoff) && applied < cutoff) {
                return false;
            }
        }

        if (filters.companyName && !item.companyName.toLowerCase().includes(filters.companyName.toLowerCase())) {
            return false;
        }

        if (filters.offerStatus && item.offerStatus !== filters.offerStatus) {
            return false;
        }

        if (filters.resumeVersion && !(item.resumeVersion ?? '').toLowerCase().includes(filters.resumeVersion.toLowerCase())) {
            return false;
        }

        if (filters.platform && !(item.platform ?? '').toLowerCase().includes(filters.platform.toLowerCase())) {
            return false;
        }

        return true;
    });
}

export const handlers = [
    http.get('/api/applications', ({ request }) => {
        const url = new URL(request.url);
        return HttpResponse.json(applyFilters(applications, url.searchParams));
    }),

    http.put('/api/applications/:id', async ({ params, request }) => {
        const id = Number(params['id']);
        if (!Number.isFinite(id)) {
            return HttpResponse.json({ message: 'Invalid id' }, { status: 400 });
        }

        const payload = (await request.json()) as ApplicationUpdateRequest;
        const index = applications.findIndex((item) => item.id === id);

        if (index === -1) {
            return HttpResponse.json({ message: 'Application not found' }, { status: 404 });
        }

        const updated = { ...applications[index], ...payload } satisfies JobApplication;
        applications = applications.map((item) => (item.id === id ? updated : item));
        return HttpResponse.json(updated);
    }),

    http.delete('/api/applications/:id', ({ params }) => {
        const id = Number(params['id']);
        if (!Number.isFinite(id)) {
            return HttpResponse.json({ message: 'Invalid id' }, { status: 400 });
        }

        applications = applications.filter((item) => item.id !== id);
        return new HttpResponse(null, { status: 204 });
    }),
];