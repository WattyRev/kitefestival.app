"use client";

import { useEffect, useState } from "react";
import H1 from "./ui/H1";
import { Table, Tbody, Td, Th, Thead, Tr } from "./ui/Table";
import { css } from "../../styled-system/css";
import TextInput from "./ui/TextInput";
import { getLogs } from "../app/api/actionLog";
import Button from "./ui/Button";
import downloadAsCsv from "../util/downloadAsCsv";

const filterEvents = async (eventId, actionContains) => {
    const logArgs = {};
    if (eventId) {
        logArgs.eventId = eventId;
    }
    if (actionContains) {
        logArgs.actionContains = actionContains;
    }
    const logs = await getLogs(logArgs);
    return logs;
};

const recursiveFetchLogs = async (
    eventFilter,
    actionFilter,
    offset = 0,
    accumulatedLogs = [],
) => {
    const logArgs = { limit: 100, offset };
    if (eventFilter) {
        logArgs.eventId = eventFilter;
    }
    if (actionFilter) {
        logArgs.actionContains = actionFilter;
    }
    const logs = await getLogs(logArgs);
    const combinedLogs = accumulatedLogs.concat(logs);
    if (logs.length === 100) {
        return recursiveFetchLogs(
            eventFilter,
            actionFilter,
            offset + 100,
            combinedLogs,
        );
    }
    return combinedLogs;
};

const downloadCSV = async (eventFilter, actionFilter) => {
    const header = [
        "ID",
        "Timestamp",
        "Action",
        "Event",
        "Event ID",
        "Activity",
        "Activity ID",
    ];

    const allLogs = await recursiveFetchLogs(eventFilter, actionFilter);

    const csvRows = [
        header.join(","),
        ...allLogs.map((log) => {
            const row = [
                log.id,
                log.timestamp.toISOString(),
                log.action.replaceAll(",", ""),
                log.eventName ? log.eventName.replaceAll(",", "") : "N/A",
                log.eventId || "N/A",
                log.activityTitle
                    ? log.activityTitle.replaceAll(",", "")
                    : "N/A",
                log.activityId || "N/A",
            ];
            return row.join(",");
        }),
    ];

    const csvContent = csvRows.join("\n");
    downloadAsCsv(csvContent, "kite-festival-logs.csv");
};

const LogsPage = ({ logs: initialLogs, events }) => {
    const [logs, setLogs] = useState(initialLogs);
    const [pending, setPending] = useState(false);
    const [pendingDownload, setPendingDownload] = useState(false);
    const [eventFilter, setEventFilter] = useState(null);
    const [actionFilter, setActionFilter] = useState("");

    useEffect(() => {
        setPending(true);
        filterEvents(eventFilter, actionFilter)
            .then((filteredLogs) => {
                setLogs(filteredLogs);
                setPending(false);
            })
            .catch(() => {
                setPending(false);
            });
    }, [eventFilter, actionFilter, setPending, setLogs]);

    const handleDownloadCsv = async () => {
        setPendingDownload(true);
        await downloadCSV(eventFilter, actionFilter);
        setPendingDownload(false);
    };

    return (
        <>
            <H1>Logs {pending && <i className="fa fa-spinner fa-spin" />}</H1>
            <div className={css({ display: "flex", alignItems: "center" })}>
                <div className={css({ marginRight: "16px" })}>
                    <select
                        data-testid="event-filter"
                        value={eventFilter || ""}
                        onChange={(e) => setEventFilter(e.target.value || null)}
                    >
                        <option value="">All Events</option>
                        {events.map((event) => (
                            <option key={event.id} value={event.id}>
                                {event.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className={css({ marginRight: "16px" })}>
                    <TextInput
                        data-testid="action-filter"
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        placeholder="Filter by action text"
                    />
                </div>
                <Button
                    data-testid="download-csv"
                    onClick={handleDownloadCsv}
                    disabled={pendingDownload}
                >
                    <i className="fa fa-save" /> Export CSV{" "}
                    {pendingDownload && <i className="fa fa-spinner fa-spin" />}
                </Button>
            </div>
            <Table>
                <Thead>
                    <Tr>
                        <Th>Timestamp</Th>
                        <Th>Action</Th>
                        <Th>Event</Th>
                        <Th>Activity</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {logs &&
                        logs.map((log) => (
                            <Tr key={log.id} data-testid="log-row">
                                <Td>{log.timestamp.toLocaleString()}</Td>
                                <Td>{log.action}</Td>
                                <Td>{log.eventName || "N/A"}</Td>
                                <Td>
                                    {log.activityTitle ||
                                        log.activityId ||
                                        "N/A"}
                                </Td>
                            </Tr>
                        ))}
                </Tbody>
            </Table>
        </>
    );
};

export default LogsPage;
