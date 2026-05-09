import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Upload, X, Image as ImageIcon, FileText, Star, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface ContentUploadsPanelProps {
  projectId: string;
  canEdit: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const CATEGORY_LABELS: Record<ContentUpload['category'], string> = {
  logo: 'Logo',
  floor_plan: 'Floor Plan',
  style_photo: 'Style Photo',
  menu_photo: 'Menu Photo',
  other: 'Other Document',
};

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
const ACCEPTED_FILE_TYPES = [...ACCEPTED_IMAGE_TYPES, 'application/pdf'];

export function ContentUploadsPanel({ projectId, canEdit }: ContentUploadsPanelProps) {
  const [uploads, setUploads] = useState<ContentUpload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUploads();
  }, [projectId]);

  const loadUploads = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('project_content_uploads')
        .select('*')
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setUploads(data || []);
    } catch (error) {
      console.error('Failed to load uploads:', error);
      toast({
        title: 'Error',
        description: 'Failed to load uploads',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || !canEdit) return;

    const file = files[0];

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload PNG, JPG, WEBP, SVG, or PDF files only',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB',
        variant: 'destructive',
      });
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { user } } = await supabase.auth.getUser();

      const { error: dbError } = await supabase
        .from('project_content_uploads')
        .insert({
          project_id: projectId,
          file_url: fileName,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          category: 'other',
          uploaded_by: user?.id,
        });

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'File uploaded successfully',
      });

      await loadUploads();
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (uploadId: string, fileUrl: string) => {
    if (!canEdit) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('project-uploads')
        .remove([fileUrl]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('project_content_uploads')
        .delete()
        .eq('id', uploadId);

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'File deleted successfully',
      });

      await loadUploads();
    } catch (error) {
      console.error('Delete failed:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete file',
        variant: 'destructive',
      });
    }
  };

  const handleCategoryChange = async (uploadId: string, category: ContentUpload['category']) => {
    if (!canEdit) return;

    try {
      const { error } = await supabase
        .from('project_content_uploads')
        .update({ category })
        .eq('id', uploadId);

      if (error) throw error;

      setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, category } : u));
    } catch (error) {
      console.error('Update failed:', error);
      toast({
        title: 'Update failed',
        description: 'Failed to update category',
        variant: 'destructive',
      });
    }
  };

  const handleCaptionChange = async (uploadId: string, caption: string) => {
    if (!canEdit) return;

    try {
      const { error } = await supabase
        .from('project_content_uploads')
        .update({ caption: caption || null })
        .eq('id', uploadId);

      if (error) throw error;

      setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, caption } : u));
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleSetPrimaryLogo = async (uploadId: string) => {
    if (!canEdit) return;

    try {
      await supabase
        .from('project_content_uploads')
        .update({ is_primary_logo: false })
        .eq('project_id', projectId);

      const { error } = await supabase
        .from('project_content_uploads')
        .update({ is_primary_logo: true })
        .eq('id', uploadId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Primary logo updated',
      });

      await loadUploads();
    } catch (error) {
      console.error('Update failed:', error);
      toast({
        title: 'Update failed',
        description: 'Failed to set primary logo',
        variant: 'destructive',
      });
    }
  };

  const getFileUrl = async (fileUrl: string): Promise<string> => {
    const { data } = await supabase.storage
      .from('project-uploads')
      .createSignedUrl(fileUrl, 3600);

    return data?.signedUrl || '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Content Uploads
        </CardTitle>
        <CardDescription>
          Upload logos, floor plans, and photos to make your plan look professional.
          Maximum file size: 10MB.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {canEdit && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <p className="text-sm text-slate-600 mb-2">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-xs text-slate-500 mb-4">
              Accepts: PNG, JPG, WEBP, SVG, PDF
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILE_TYPES.join(',')}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              variant="outline"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Browse Files'
              )}
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
          </div>
        ) : uploads.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No files uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {uploads.map((upload) => (
              <UploadItem
                key={upload.id}
                upload={upload}
                canEdit={canEdit}
                onDelete={handleDelete}
                onCategoryChange={handleCategoryChange}
                onCaptionChange={handleCaptionChange}
                onSetPrimaryLogo={handleSetPrimaryLogo}
                getFileUrl={getFileUrl}
                formatFileSize={formatFileSize}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface UploadItemProps {
  upload: ContentUpload;
  canEdit: boolean;
  onDelete: (id: string, fileUrl: string) => void;
  onCategoryChange: (id: string, category: ContentUpload['category']) => void;
  onCaptionChange: (id: string, caption: string) => void;
  onSetPrimaryLogo: (id: string) => void;
  getFileUrl: (fileUrl: string) => Promise<string>;
  formatFileSize: (bytes: number) => string;
}

function UploadItem({
  upload,
  canEdit,
  onDelete,
  onCategoryChange,
  onCaptionChange,
  onSetPrimaryLogo,
  getFileUrl,
  formatFileSize,
}: UploadItemProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [caption, setCaption] = useState(upload.caption || '');

  useEffect(() => {
    const loadThumbnail = async () => {
      const url = await getFileUrl(upload.file_url);
      setThumbnailUrl(url);
    };
    loadThumbnail();
  }, [upload.file_url]);

  const isImage = upload.file_type.startsWith('image/');
  const isPDF = upload.file_type === 'application/pdf';

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex gap-3">
        <div className="flex-shrink-0 w-20 h-20 bg-slate-100 rounded flex items-center justify-center overflow-hidden">
          {isImage && thumbnailUrl ? (
            <img src={thumbnailUrl} alt={upload.file_name} className="w-full h-full object-cover" />
          ) : isPDF ? (
            <FileText className="h-10 w-10 text-slate-400" />
          ) : (
            <FileText className="h-10 w-10 text-slate-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{upload.file_name}</p>
              <p className="text-xs text-slate-500">{formatFileSize(upload.file_size)}</p>
            </div>
            <div className="flex items-center gap-2">
              {upload.is_primary_logo && (
                <Badge variant="default" className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Primary
                </Badge>
              )}
              {canEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(upload.id, upload.file_url)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="mt-2 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Category</Label>
                <Select
                  value={upload.category}
                  onValueChange={(value) => onCategoryChange(upload.id, value as ContentUpload['category'])}
                  disabled={!canEdit}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {upload.category === 'logo' && canEdit && !upload.is_primary_logo && (
                <div className="flex items-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSetPrimaryLogo(upload.id)}
                    className="w-full"
                  >
                    Set as Primary
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs">Caption (optional)</Label>
              <Input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                onBlur={() => onCaptionChange(upload.id, caption)}
                placeholder="Add a caption..."
                disabled={!canEdit}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
