import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CheckCircle, RefreshCw, Download, Key, MoreVertical } from 'lucide-react';

interface ApplicationDetailsHeaderProps {
    areAllDocumentsApproved: boolean;
    onPushForQualityCheck: () => void;
    onRefresh: () => void;
    isRefreshing: boolean;
    onDownloadAll: () => void;
    onResetPassword: () => void;
    onActivateAccount?: () => void;
    userRole?: string;
}

export function ApplicationDetailsHeader({
    areAllDocumentsApproved,
    onPushForQualityCheck,
    onRefresh,
    isRefreshing,
    onDownloadAll,
    onResetPassword,
    onActivateAccount,
    userRole,
}: ApplicationDetailsHeaderProps) {
    const isAdmin = userRole !== 'client';

    return (
        <div className="flex items-center gap-2">

            {/* Push for Quality Check Button */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <div>
                        <Button
                            variant={areAllDocumentsApproved ? "default" : "outline"}
                            size="sm"
                            onClick={onPushForQualityCheck}
                            disabled={!areAllDocumentsApproved}
                            className={`flex items-center gap-2 cursor-pointer ${areAllDocumentsApproved
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : "opacity-50 cursor-not-allowed"
                                }`}
                        >
                            <CheckCircle className="h-4 w-4" />
                            <span className="hidden sm:inline">Push for Quality Check</span>
                        </Button>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    {areAllDocumentsApproved
                        ? "All mandatory documents are reviewed or approved. Ready for quality check."
                        : "All mandatory documents must be submitted and reviewed or approved before pushing for quality check."}
                </TooltipContent>
            </Tooltip>

            {/* Refresh Button */}
            <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 cursor-pointer"
            >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
            </Button>

            {isAdmin && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 cursor-pointer"
                        >
                            <MoreVertical className="h-4 w-4" />
                            <span className="hidden sm:inline">Actions</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-44 mt-1" align="end">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>Account</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={onResetPassword}
                                className="cursor-pointer hover:bg-gray-100"
                            >
                                Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={onActivateAccount ? () => onActivateAccount() : undefined}
                                className="cursor-pointer hover:bg-gray-100"
                            >
                                Activate Account
                            </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Documents</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={onDownloadAll}
                                disabled={!areAllDocumentsApproved}
                                className="cursor-pointer hover:bg-gray-100"
                            >
                                Download Documents
                            </DropdownMenuItem>
                        </DropdownMenuGroup>


                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}

