package service

import (
	"encoding/json"
	"time"

	"lab-asset-manager/internal/repository"
)

type AuditAction string

const (
	AuditCreate AuditAction = "CREATE"
	AuditRead   AuditAction = "READ"
	AuditUpdate AuditAction = "UPDATE"
	AuditDelete AuditAction = "DELETE"
	AuditUpload AuditAction = "UPLOAD"
	AuditLogin  AuditAction = "LOGIN"
)

type AuditLog struct {
	ID         int64     `json:"id"`
	UserID     string    `json:"user_id"`
	Action     string    `json:"action"`
	Resource   string    `json:"resource"`
	ResourceID string    `json:"resource_id"`
	Details    string    `json:"details"`
	IPAddress  string    `json:"ip_address"`
	CreatedAt  time.Time `json:"created_at"`
}

func RecordAudit(userID, action, resource, resourceID string, details interface{}, ipAddress string) {
	detailBytes, _ := json.Marshal(details)
	detailStr := string(detailBytes)
	if detailStr == "null" {
		detailStr = ""
	}

	repository.DB.Exec(`
		INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address)
		VALUES (?, ?, ?, ?, ?, ?)
	`, userID, action, resource, resourceID, detailStr, ipAddress)
}

func GetAuditLogs(resource string, limit int) ([]AuditLog, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	query := "SELECT id, user_id, action, resource, resource_id, details, ip_address, created_at FROM audit_logs"
	args := []interface{}{}

	if resource != "" {
		query += " WHERE resource = ?"
		args = append(args, resource)
	}

	query += " ORDER BY created_at DESC LIMIT ?"
	args = append(args, limit)

	rows, err := repository.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []AuditLog
	for rows.Next() {
		var log AuditLog
		if err := rows.Scan(&log.ID, &log.UserID, &log.Action, &log.Resource, &log.ResourceID, &log.Details, &log.IPAddress, &log.CreatedAt); err != nil {
			continue
		}
		logs = append(logs, log)
	}

	if logs == nil {
		logs = []AuditLog{}
	}
	return logs, nil
}
