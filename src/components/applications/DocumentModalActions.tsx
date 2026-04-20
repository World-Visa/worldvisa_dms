import React from 'react'
import { Button } from '../ui/primitives/button'
import { RiArrowDownSLine, RiDeleteBin2Line, RiHistoryLine, RiRouteFill } from 'react-icons/ri'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/primitives/dropdown-menu'

interface DocumentModalActionsProps {
    onActivityLog: () => void
    onDeletedFiles: () => void
    onSendForVerification?: () => void
    isClientView?: boolean
}

const DocumentModalActions = ({ onActivityLog, onDeletedFiles, onSendForVerification, isClientView = false }: DocumentModalActionsProps) => {
    return (
        <div className="flex items-center">
            {!isClientView ? (
                <>

                    <Button
                        mode="gradient"
                        variant="primary"
                        size="2xs"
                        className="rounded-r-none border-r border-white/20 text-xs"
                        leadingIcon={RiRouteFill}
                        onClick={onSendForVerification}
                    >
                        Send for review
                    </Button>
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                mode="gradient"
                                variant="primary"
                                size="2xs"
                                className="rounded-l-none px-1.5 text-xs"
                                leadingIcon={RiArrowDownSLine}
                            />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-50 rounded-xl" align="end">
                            <DropdownMenuItem className="cursor-pointer" onSelect={onActivityLog}>
                                <RiHistoryLine />
                                Activity Log
                            </DropdownMenuItem>
                            {!isClientView && (
                                <DropdownMenuItem className="cursor-pointer" onSelect={onDeletedFiles}>
                                    <RiDeleteBin2Line />
                                    Deleted Files
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </>
            ) :
                <Button
                    mode="filled"
                    variant="secondary"
                    size="2xs"
                    className="text-xs"
                    leadingIcon={RiHistoryLine}
                    onClick={onActivityLog}
                >
                    Activity Log
                </Button>
            }
        </div>
    )
}

export default DocumentModalActions
