export interface Organization {
    id: string;
    name: string;
    licenseCount: number;
}

export interface IIkoLicense {
    organizationId: string;
    organization: Organization;
    productName: string;
    productSubName: string;
    apUId: string;
    apRequest: string;
    licenseCode: string;
    generateDate: string;
    lastRequestDate: string;
    licenseExpirationDate: string;
    isActive: boolean;
    isEnabled: boolean;
    isOnline: boolean;
    id: string;
}

export interface IIkoLicenseItem {
    license: IIkoLicense;
    org: Organization;
}

export interface IIkoLicensesResponse {
    page: number;
    limit: number;
    total: number;
    items: IIkoLicenseItem[];
}

export interface IIkoLicenseFilters {
    search?: string;
    status?: 'active' | 'expired' | 'all';
    organizationId?: string;
    isOnline?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export type LicenseStatus = 'active' | 'expired' | 'all';
export type GroupByType = 'organization' | 'none';