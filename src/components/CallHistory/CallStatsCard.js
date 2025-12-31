import React from "react";
import { Grid, Paper, Box, Typography } from "@mui/material";
import {
  Phone,
  CheckCircle,
  Cancel,
  Schedule,
  TrendingUp,
} from "@mui/icons-material";

const CallStatsCard = ({ stats }) => {
  const statCards = [
    {
      title: "Total Calls",
      value: stats.totalCalls || 0,
      icon: <Phone />,
      color: "#1976d2",
    },
    {
      title: "Completed",
      value: stats.completedCalls || 0,
      icon: <CheckCircle />,
      color: "#2e7d32",
    },
    {
      title: "Failed",
      value: stats.failedCalls || 0,
      icon: <Cancel />,
      color: "#d32f2f",
    },
    {
      title: "No Answer",
      value: stats.noAnswerCalls || 0,
      icon: <Schedule />,
      color: "#ed6c02",
    },
    {
      title: "Completion Rate",
      value: `${stats.completionRate || 0}%`,
      icon: <TrendingUp />,
      color: "#9c27b0",
    },
  ];
  
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {statCards.map((card, index) => (
        <Grid item xs={12} sm={6} md={2.4} key={index}>
          <Paper
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
              borderLeft: `4px solid ${card.color}`,
            }}
          >
            <Box
              sx={{
                backgroundColor: `${card.color}20`,
                borderRadius: "50%",
                p: 1,
                display: "flex",
                color: card.color,
              }}
            >
              {card.icon}
            </Box>
            <Box>
              <Typography variant="body2" color="textSecondary">
                {card.title}
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {card.value}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default CallStatsCard;
