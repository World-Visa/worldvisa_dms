/**
 * Sample Document Service
 * 
 * This service handles sample document operations including
 * resolution, caching, and download functionality.
 */

import { COMPANY_DOCUMENTS } from '@/lib/documents/checklist';
import type { SampleDocument, DocumentTypeWithSample } from '@/types/samples';

class SampleDocumentService {
  private sampleCache = new Map<string, SampleDocument>();
  private readonly CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
  private cacheTimestamps = new Map<string, number>();

  /**
   * Get sample document information for a specific document type and category
   */
  getSampleDocument(documentType: string, category: string): SampleDocument | null {
    const cacheKey = this.getCacheKey(documentType, category);
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.sampleCache.get(cacheKey) || null;
    }

    // Find document type with sample
    const documentWithSample = this.findDocumentWithSample(documentType, category);
    
    if (!documentWithSample?.sampleDocument) {
      return null;
    }

    const sampleDoc: SampleDocument = {
      id: this.generateId(documentType, category),
      name: `${documentType} Sample`,
      path: documentWithSample.sampleDocument,
      documentType,
      category,
      description: `Sample template for ${documentType}`
    };

    // Cache the result
    this.cacheSample(cacheKey, sampleDoc);
    
    return sampleDoc;
  }

  /**
   * Check if a document type has a sample document available
   */
  hasSampleDocument(documentType: string, category: string): boolean {
    const cacheKey = this.getCacheKey(documentType, category);
    
    if (this.isCacheValid(cacheKey)) {
      return this.sampleCache.has(cacheKey);
    }

    const documentWithSample = this.findDocumentWithSample(documentType, category);
    const hasSample = !!(documentWithSample?.sampleDocument);
    
    if (hasSample) {
      const sampleDoc: SampleDocument = {
        id: this.generateId(documentType, category),
        name: `${documentType} Sample`,
        path: documentWithSample!.sampleDocument!,
        documentType,
        category,
        description: `Sample template for ${documentType}`
      };
      this.cacheSample(cacheKey, sampleDoc);
    }
    
    return hasSample;
  }

  /**
   * Download a sample document
   */
  async downloadSampleDocument(samplePath: string, fileName: string): Promise<void> {
    try {
      // Validate the path
      if (!samplePath || !samplePath.startsWith('/sample_documents/')) {
        throw new Error('Invalid sample document path');
      }

      // Validate file name
      if (!fileName || fileName.trim().length === 0) {
        throw new Error('Invalid file name');
      }

      // Check if document is accessible (optional - can be removed if causing issues)
      try {
        const response = await fetch(samplePath, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`Sample document not accessible: ${response.status} ${response.statusText}`);
        }
      } catch (fetchError) {
        // Log but don't fail - the document might still be downloadable
        console.warn('Could not verify sample document accessibility:', fetchError);
      }

      // Create download link
      const link = document.createElement('a');
      link.href = samplePath;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Clean up after a short delay
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 100);
      
    } catch (error) {
      console.error('Download failed:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Invalid sample document path')) {
          throw new Error('Sample document path is invalid or corrupted');
        } else if (error.message.includes('not accessible')) {
          throw new Error('Sample document is currently unavailable');
        } else if (error.message.includes('Invalid file name')) {
          throw new Error('Invalid file name provided for download');
        }
      }
      
      throw new Error(`Failed to download sample document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all available sample documents
   */
  getAllSampleDocuments(): SampleDocument[] {
    const samples: SampleDocument[] = [];
    
    COMPANY_DOCUMENTS.forEach(doc => {
      if (doc.sampleDocument) {
        samples.push({
          id: this.generateId(doc.documentType, doc.category),
          name: `${doc.documentType} Sample`,
          path: doc.sampleDocument,
          documentType: doc.documentType,
          category: doc.category,
          description: `Sample template for ${doc.documentType}`
        });
      }
    });

    return samples;
  }

  /**
   * Clear the sample document cache
   */
  clearCache(): void {
    this.sampleCache.clear();
    this.cacheTimestamps.clear();
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.sampleCache.size,
      keys: Array.from(this.sampleCache.keys())
    };
  }

  // Private helper methods

  private findDocumentWithSample(documentType: string, category: string): DocumentTypeWithSample | null {
    // Normalize category for comparison
    const normalizedCategory = this.normalizeCategory(category);
    
    return COMPANY_DOCUMENTS.find(doc => 
      doc.documentType === documentType && 
      this.normalizeCategory(doc.category) === normalizedCategory
    ) || null;
  }

  private normalizeCategory(category: string): string {
    // Handle different category formats
    if (category === 'Company' || category === 'Company Documents' || category.includes('Company Documents')) {
      return 'Company';
    }
    return category;
  }

  private getCacheKey(documentType: string, category: string): string {
    return `${documentType}-${this.normalizeCategory(category)}`;
  }

  private generateId(documentType: string, category: string): string {
    return `sample-${documentType.toLowerCase().replace(/\s+/g, '-')}-${this.normalizeCategory(category).toLowerCase()}`;
  }

  private isCacheValid(cacheKey: string): boolean {
    const timestamp = this.cacheTimestamps.get(cacheKey);
    if (!timestamp) return false;
    
    return Date.now() - timestamp < this.CACHE_EXPIRY;
  }

  private cacheSample(cacheKey: string, sample: SampleDocument): void {
    this.sampleCache.set(cacheKey, sample);
    this.cacheTimestamps.set(cacheKey, Date.now());
  }
}

// Export singleton instance
export const sampleDocumentService = new SampleDocumentService();

// Export class for testing purposes
export { SampleDocumentService };
