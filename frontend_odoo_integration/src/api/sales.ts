import api from './client';

interface SaleLine {
  product_id: number;
  quantity: number;
  price_unit: number;
}

export type SaleDocumentDiagnostics = {
  saleOrderId: number;
  state: string;
  documentType: 'quotation' | 'sale_order';
  availableDocuments: {
    quotationPdf: boolean;
    saleOrderPdf: boolean;
    draftInvoicePdf: boolean;
    postedInvoicePdf: boolean;
  };
  invoices: Array<{
    id: number;
    name: string;
    state: 'draft' | 'posted' | string;
    canDownload: boolean;
    isFinal: boolean;
  }>;
};

function downloadBlob(data: BlobPart, filename: string) {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

export const salesApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    api.get('/sales', { params }).then((r) => r.data),

  listQuotations: (params?: { limit?: number; offset?: number }) =>
    api.get('/sales/quotations', { params }).then((r) => r.data),

  listOrders: (params?: { limit?: number; offset?: number }) =>
    api.get('/sales/orders', { params }).then((r) => r.data),

  getById: (id: number) =>
    api.get(`/sales/${id}`).then((r) => r.data),

  getSaleDocuments: (saleOrderId: number) =>
    api.get<SaleDocumentDiagnostics>(`/sales/${saleOrderId}/documents`).then((r) => r.data),

  create: (data: { partner_id: number; lines: SaleLine[] }) =>
    api.post('/sales', data).then((r) => r.data),

  confirm: (id: number) =>
    api.post(`/sales/${id}/confirm`).then((r) => r.data),

  createInvoice: (id: number) =>
    api.post(`/sales/${id}/invoice`).then((r) => r.data),

  downloadQuotationPdf: (saleOrderId: number) =>
    api.get(`/sales/${saleOrderId}/quotation/pdf`, { responseType: 'blob' }).then((r) => {
      downloadBlob(r.data, `cotizacion-${saleOrderId}.pdf`);
    }),

  downloadSaleOrderPdf: (saleOrderId: number) =>
    api.get(`/sales/${saleOrderId}/order/pdf`, { responseType: 'blob' }).then((r) => {
      downloadBlob(r.data, `orden-venta-${saleOrderId}.pdf`);
    }),

  downloadInvoicePdf: (invoiceId: number, isFinal = true) =>
    api.get(isFinal ? `/sales/invoices/${invoiceId}/pdf` : `/sales/invoices/${invoiceId}/draft/pdf`, { responseType: 'blob' }).then((r) => {
      downloadBlob(r.data, isFinal ? `factura-final-${invoiceId}.pdf` : `factura-borrador-${invoiceId}.pdf`);
    }),

  // Compatibilidad legado (no usar en UI principal)
  downloadInvoicePdfLegacy: (saleOrderId: number) =>
    api.get(`/sales/${saleOrderId}/invoice/pdf`, { responseType: 'blob' }).then((r) => {
      downloadBlob(r.data, `invoice-order-${saleOrderId}.pdf`);
    }),
};
