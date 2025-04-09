import React, { useState } from 'react';
import {
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Typography,
    Box,
    ListItemButton
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Visibility as ViewIcon, Download as DownloadIcon } from '@mui/icons-material';
import SchematicDetail from './SchematicDetail';
import { downloadSchematic } from '../services/api';

const SchematicList = ({ schematics, onDelete, onEdit }) => {
    const [selectedSchematic, setSelectedSchematic] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const handleViewDetail = (schematic) => {
        setSelectedSchematic(schematic);
        setDetailOpen(true);
    };

    const handleCloseDetail = () => {
        setDetailOpen(false);
        setSelectedSchematic(null);
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                原理图列表
            </Typography>
            <List>
                {schematics.map((schematic) => (
                    <ListItem
                        key={schematic.id}
                        secondaryAction={
                            <ListItemSecondaryAction sx={{ display: 'flex', gap: 1 }}>
                                <IconButton
                                    edge="end"
                                    aria-label="view"
                                    onClick={() => handleViewDetail(schematic)}
                                >
                                    <ViewIcon />
                                </IconButton>
                                <IconButton
                                    edge="end"
                                    aria-label="edit"
                                    onClick={() => onEdit(schematic)}
                                >
                                    <EditIcon />
                                </IconButton>
                                <IconButton
                                    edge="end"
                                    aria-label="delete"
                                    onClick={() => onDelete(schematic.id)}
                                >
                                    <DeleteIcon />
                                </IconButton>
                                <IconButton
                                    edge="end"
                                    aria-label="download"
                                    onClick={() => downloadSchematic(schematic.id, schematic.name)}
                                >
                                    <DownloadIcon />
                                </IconButton>
                            </ListItemSecondaryAction>
                        }
                    >
                        <ListItemButton onClick={() => handleViewDetail(schematic)}>
                            <ListItemText
                                primary={schematic.name}
                                secondary={`创建时间: ${new Date(schematic.created_at).toLocaleString()}`}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            <SchematicDetail
                open={detailOpen}
                onClose={handleCloseDetail}
                schematicId={selectedSchematic?.id}
            />
        </Box>
    );
};

export default SchematicList; 