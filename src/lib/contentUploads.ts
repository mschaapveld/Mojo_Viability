import { supabase } from './supabase';

export interface ContentUpload {
  id: string;
  project_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  category: 'logo' | 'floor_plan' | 'style_photo' | 'menu_photo' | 'other';
  caption: string | null;
  is_primary_logo: boolean;
  uploaded_at: string;
  uploaded_by: string | null;
}

export async function loadProjectUploads(projectId: string): Promise<ContentUpload[]> {
  try {
    const { data, error } = await supabase
      .from('project_content_uploads')
      .select('*')
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to load uploads:', error);
    return [];
  }
}

export async function getSignedUrl(fileUrl: string): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from('project-uploads')
      .createSignedUrl(fileUrl, 3600);

    if (error) throw error;
    return data?.signedUrl || '';
  } catch (error) {
    console.error('Failed to get signed URL:', error);
    return '';
  }
}

export async function getUploadsByCategory(projectId: string): Promise<{
  primaryLogo: ContentUpload | null;
  logos: ContentUpload[];
  floorPlans: ContentUpload[];
  stylePhotos: ContentUpload[];
  menuPhotos: ContentUpload[];
  other: ContentUpload[];
}> {
  const uploads = await loadProjectUploads(projectId);

  return {
    primaryLogo: uploads.find(u => u.category === 'logo' && u.is_primary_logo) || null,
    logos: uploads.filter(u => u.category === 'logo'),
    floorPlans: uploads.filter(u => u.category === 'floor_plan'),
    stylePhotos: uploads.filter(u => u.category === 'style_photo'),
    menuPhotos: uploads.filter(u => u.category === 'menu_photo'),
    other: uploads.filter(u => u.category === 'other'),
  };
}

export async function generateUploadsHtml(projectId: string): Promise<string> {
  const categorized = await getUploadsByCategory(projectId);
  let html = '';

  if (categorized.primaryLogo) {
    const logoUrl = await getSignedUrl(categorized.primaryLogo.file_url);
    if (logoUrl) {
      html += `<div class="text-center mb-4"><img src="${logoUrl}" alt="${categorized.primaryLogo.file_name}" style="max-width: 200px; max-height: 100px; margin: 0 auto;" /></div>`;
    }
  }

  return html;
}

export async function generateFloorPlanHtml(projectId: string): Promise<string> {
  const categorized = await getUploadsByCategory(projectId);

  if (categorized.floorPlans.length === 0) return '';

  let html = '<div class="mt-4"><h3 class="font-semibold text-slate-700 mb-3">Floor Plan</h3>';

  for (const floorPlan of categorized.floorPlans) {
    const url = await getSignedUrl(floorPlan.file_url);
    if (url) {
      const isPDF = floorPlan.file_type === 'application/pdf';
      if (isPDF) {
        html += `<div class="mb-3"><p class="text-sm text-slate-600 mb-2">${floorPlan.caption || 'Floor plan document'}</p><div class="border rounded p-4 bg-slate-50"><p class="text-sm text-slate-600">📄 ${floorPlan.file_name}</p><p class="text-xs text-slate-500 mt-1">PDF document (view in separate viewer)</p></div></div>`;
      } else {
        html += `<div class="mb-3"><img src="${url}" alt="${floorPlan.caption || floorPlan.file_name}" style="max-width: 100%; height: auto; border: 1px solid #e2e8f0; border-radius: 4px;" />`;
        if (floorPlan.caption) {
          html += `<p class="text-xs text-slate-500 mt-2 text-center italic">${floorPlan.caption}</p>`;
        }
        html += `</div>`;
      }
    }
  }

  html += '</div>';
  return html;
}

export async function generateStylePhotosHtml(projectId: string): Promise<string> {
  const categorized = await getUploadsByCategory(projectId);

  if (categorized.stylePhotos.length === 0) return '';

  let html = '<div class="mt-6"><h3 class="font-semibold text-slate-700 mb-3">Design & Venue Style</h3><div class="grid grid-cols-2 gap-3">';

  const maxPhotos = Math.min(6, categorized.stylePhotos.length);
  for (let i = 0; i < maxPhotos; i++) {
    const photo = categorized.stylePhotos[i];
    const url = await getSignedUrl(photo.file_url);
    if (url) {
      html += `<div><img src="${url}" alt="${photo.caption || photo.file_name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 4px; border: 1px solid #e2e8f0;" />`;
      if (photo.caption) {
        html += `<p class="text-xs text-slate-500 mt-1 text-center">${photo.caption}</p>`;
      }
      html += `</div>`;
    }
  }

  html += '</div></div>';
  return html;
}

export async function generateMenuPhotosHtml(projectId: string): Promise<string> {
  const categorized = await getUploadsByCategory(projectId);

  if (categorized.menuPhotos.length === 0) return '';

  let html = '<div class="mt-4"><h3 class="font-semibold text-slate-700 mb-3">Menu Images</h3><div class="grid grid-cols-2 gap-3">';

  for (const photo of categorized.menuPhotos) {
    const url = await getSignedUrl(photo.file_url);
    if (url) {
      html += `<div><img src="${url}" alt="${photo.caption || photo.file_name}" style="width: 100%; height: auto; border-radius: 4px; border: 1px solid #e2e8f0;" />`;
      if (photo.caption) {
        html += `<p class="text-xs text-slate-500 mt-1 text-center">${photo.caption}</p>`;
      }
      html += `</div>`;
    }
  }

  html += '</div></div>';
  return html;
}

export async function generateAppendixHtml(projectId: string): Promise<string> {
  const categorized = await getUploadsByCategory(projectId);

  const allDocs = [
    ...categorized.other,
    ...categorized.floorPlans.filter(f => f.file_type === 'application/pdf'),
  ];

  if (allDocs.length === 0) return '';

  let html = '<section class="mb-10"><h2 class="text-xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-blue-500">Appendix: Supporting Documents</h2><table class="w-full text-sm"><thead><tr class="border-b-2 bg-slate-50"><th class="py-2 px-3 text-left text-slate-700">Document Name</th><th class="py-2 px-3 text-left text-slate-700">Description</th></tr></thead><tbody>';

  for (const doc of allDocs) {
    html += `<tr class="border-b"><td class="py-2 px-3 font-medium">${doc.file_name}</td><td class="py-2 px-3 text-slate-600">${doc.caption || 'Supporting document'}</td></tr>`;
  }

  html += '</tbody></table></section>';
  return html;
}
