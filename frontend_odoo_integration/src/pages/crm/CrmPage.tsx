import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '../../api/crm';

export default function CrmPage() {
  const queryClient = useQueryClient();

  const { data: stages } = useQuery({
    queryKey: ['crm-stages'],
    queryFn: crmApi.getStages,
  });

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['crm-leads'],
    queryFn: () => crmApi.getLeads({ limit: 200 }),
  });

  const updateStage = useMutation({
    mutationFn: ({ leadId, stageId }: { leadId: number; stageId: number }) =>
      crmApi.updateStage(leadId, stageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-leads'] }),
  });

  if (isLoading) return <p className="text-gray-500">Loading CRM...</p>;

  const leads = leadsData?.items ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">CRM Pipeline</h1>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages?.map((stage: any) => {
          const stageLeads = leads.filter(
            (l: any) => l.stage_id && l.stage_id[0] === stage.id,
          );

          return (
            <div key={stage.id} className="min-w-[280px] bg-gray-100 rounded-xl p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">{stage.name}</h3>
                <span className="text-xs bg-white px-2 py-1 rounded-full">{stageLeads.length}</span>
              </div>

              <div className="space-y-2">
                {stageLeads.map((lead: any) => (
                  <div key={lead.id} className="bg-white rounded-lg p-3 shadow-sm border">
                    <p className="font-medium text-sm">{lead.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {lead.partner_id?.[1] ?? 'No contact'}
                    </p>
                    {lead.expected_revenue > 0 && (
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        ${lead.expected_revenue.toLocaleString()}
                      </p>
                    )}
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {stages
                        ?.filter((s: any) => s.id !== stage.id)
                        .map((s: any) => (
                          <button
                            key={s.id}
                            onClick={() => updateStage.mutate({ leadId: lead.id, stageId: s.id })}
                            className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-blue-100 rounded transition-colors"
                            title={`Move to ${s.name}`}
                          >
                            {s.name}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}

                {stageLeads.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">No leads</p>
                )}
              </div>
            </div>
          );
        })}

        {!stages?.length && (
          <p className="text-gray-400">No CRM stages found. Connect to Odoo to see pipeline.</p>
        )}
      </div>
    </div>
  );
}
