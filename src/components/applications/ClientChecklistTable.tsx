'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Building2,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChecklistResponse, ChecklistItem } from '@/types/checklist';
import { ClientDocument } from '@/types/client';

interface ClientChecklistTableProps {
  checklistData?: ChecklistResponse;
  documentsData?: ClientDocument[];
  isLoading: boolean;
  error: Error | null;
  onUploadSuccess?: () => void;
}

export function ClientChecklistTable({ 
  checklistData, 
  documentsData,
  isLoading, 
  error,
  onUploadSuccess
}: ClientChecklistTableProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'required':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'required':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDocumentStatus = (item: ChecklistItem): string => {
    if (!documentsData) return 'required';
    
    const submittedDocs = documentsData.filter(doc => 
      doc.document_category === item.document_category &&
      (item.company_name ? doc.document_name.includes(item.company_name) : true)
    );
    
    if (submittedDocs.length > 0) {
      return 'submitted';
    }
    
    return item.required ? 'required' : 'optional';
  };

  const getAvailableCategories = (): string[] => {
    if (!checklistData?.data || !Array.isArray(checklistData.data) || checklistData.data.length === 0) {
      return ['Identity Documents', 'Education Documents', 'Other Documents', 'Company'];
    }
    
    const categories = new Set<string>();
    checklistData.data.forEach(item => {
      categories.add(item.document_category);
    });
    return Array.from(categories);
  };

  const getFilteredItems = (): ChecklistItem[] => {
    if (!checklistData?.data || !Array.isArray(checklistData.data)) return [];
    
    if (selectedCategory === 'all') {
      return checklistData.data;
    }
    
    return checklistData.data.filter(item => item.document_category === selectedCategory);
  };

  const getCompanyCategories = (): string[] => {
    if (!checklistData?.data || !Array.isArray(checklistData.data)) return [];
    
    const companyCategories = new Set<string>();
    checklistData.data.forEach(item => {
      if (item.company_name) {
        companyCategories.add(item.document_category);
      }
    });
    return Array.from(companyCategories);
  };

  // Helper function to get category badge styling (matching admin side)
  const getCategoryBadgeStyle = (category: string) => {
    if (category.endsWith(' Documents') && 
        !['Identity Documents', 'Education Documents', 'Other Documents'].includes(category)) {
      return 'bg-orange-500 hover:bg-orange-600'; // Company documents
    }
    
    switch (category) {
      case 'Identity Documents':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'Education Documents':
        return 'bg-green-500 hover:bg-green-600';
      case 'Other Documents':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'Company':
        return 'bg-orange-500 hover:bg-orange-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Handle document viewing with Zoho document links
  const handleViewDocument = (document: ClientDocument) => {
    const url = document.document_link || document.download_url;
    if (!url) return;
    
    const width = 800;
    const height = 600;
    const top = (window.screen.height - height) / 2;
    const left = (window.screen.width - width) / 2;

    window.open(
      url,
      '_blank',
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load checklist: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  const filteredItems = getFilteredItems();
  const availableCategories = getAvailableCategories();
  const companyCategories = getCompanyCategories();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Required Documents
            </CardTitle>
            <CardDescription>
              Documents required for your application as selected by our team
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No checklist available</h3>
            <p className="text-gray-600 mb-4">
              Our team hasn&apos;t created a document checklist for your application yet. 
              You can still upload documents using the categories below.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    Upload Documents
                  </h4>
                  <p className="text-sm text-blue-700">
                    You can upload documents in common categories like Identity Documents, 
                    Education Documents, Other Documents, and Company Documents.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Category Filter */}
            {availableCategories.length > 1 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                  >
                    All Categories
                  </Button>
                  {availableCategories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Checklist Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium w-16">#</TableHead>
                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Requirement</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item, index) => {
                    const status = getDocumentStatus(item);
                    const isCompanyDocument = !!item.company_name;
                    
                    // Find submitted documents for this checklist item
                    const submittedDocs = documentsData?.filter(doc => 
                      doc.document_category === item.document_category &&
                      (item.company_name ? doc.document_name.includes(item.company_name) : true)
                    ) || [];
                    
                    return (
                      <TableRow key={item.checklist_id || index}>
                        <TableCell className="font-medium w-16">
                          {index + 1}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge 
                            variant="default" 
                            className={cn(
                              "text-xs py-1 text-white",
                              getCategoryBadgeStyle(item.document_category)
                            )}
                          >
                            {item.document_category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="truncate" title={item.document_type}>
                                <span className="text-sm font-medium">
                                  {item.document_type}
                                </span>
                              </div>
                            </div>
                            {/* Show category on mobile */}
                            <div className="sm:hidden">
                              <Badge 
                                variant="default" 
                                className={cn(
                                  "text-xs py-0.5 text-white",
                                  getCategoryBadgeStyle(item.document_category)
                                )}
                              >
                                {item.document_category}
                              </Badge>
                            </div>
                            {/* Show company name if applicable */}
                            {isCompanyDocument && (
                              <div className="flex items-center space-x-1">
                                <Building2 className="h-3 w-3 text-orange-500" />
                                <span className="text-xs text-gray-600">
                                  {item.company_name}
                                </span>
                              </div>
                            )}
                            {/* Show status on mobile */}
                            <div className="md:hidden">
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(status)}
                                <Badge 
                                  variant="secondary" 
                                  className={cn("text-xs", getStatusColor(status))}
                                >
                                  {status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(status)}
                            <Badge 
                              variant="secondary" 
                              className={getStatusColor(status)}
                            >
                              {status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge 
                            variant={item.required ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {item.required ? 'Required' : 'Optional'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {/* View submitted documents */}
                            {submittedDocs.length > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDocument(submittedDocs[0])}
                                className="text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Company Documents Notice */}
            {companyCategories.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Building2 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      Company Documents Required
                    </h4>
                    <p className="text-sm text-blue-700">
                      Some documents require company information. When uploading these documents, 
                      please specify the company name in the upload form.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
