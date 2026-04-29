package bootstrap

type Capability string

const (
	RoleOrganizationAdmin = "organization_admin"
	RoleOrganizationHead  = "organization_head"
	RoleDivisionAdmin     = "division_admin"
	RoleDivisionHead      = "division_head"
	RoleDivisionOperator  = "division_operator"
	RoleUnitAdmin         = "unit_admin"
	RoleUnitHead          = "unit_head"
	RoleUnitOperator      = "unit_operator"
	RoleAuditor           = "auditor"

	ScopeOrganization = "organization"
	ScopeDivision     = "division"
	ScopeUnit         = "unit"

	CapabilityManageStructure = Capability("manage_structure")
	CapabilityManageAccess    = Capability("manage_access")
	CapabilityManageContracts = Capability("manage_contracts")
	CapabilityManageEquipment = Capability("manage_equipment")
	CapabilityViewEmployees   = Capability("view_employees")
	CapabilityManageEmployees = Capability("manage_employees")
)

type RoleDefinition struct {
	Template        string
	Label           string
	AllowedScopes   []string
	Capabilities    []Capability
	AuditorAnyScope bool
}

var roleCatalog = map[string]RoleDefinition{
	RoleOrganizationAdmin: {
		Template:      RoleOrganizationAdmin,
		Label:         "Администратор организации",
		AllowedScopes: []string{ScopeOrganization},
		Capabilities: []Capability{
			CapabilityManageStructure,
			CapabilityManageAccess,
			CapabilityManageContracts,
			CapabilityManageEquipment,
			CapabilityViewEmployees,
			CapabilityManageEmployees,
		},
	},
	RoleOrganizationHead: {
		Template:      RoleOrganizationHead,
		Label:         "Руководитель организации",
		AllowedScopes: []string{ScopeOrganization},
		Capabilities:  []Capability{CapabilityViewEmployees},
	},
	RoleDivisionHead: {
		Template:      RoleDivisionHead,
		Label:         "Руководитель дивизиона",
		AllowedScopes: []string{ScopeDivision},
		Capabilities:  []Capability{CapabilityViewEmployees},
	},
	RoleDivisionAdmin: {
		Template:      RoleDivisionAdmin,
		Label:         "Администратор дивизиона",
		AllowedScopes: []string{ScopeDivision},
		Capabilities: []Capability{
			CapabilityManageStructure,
			CapabilityManageAccess,
			CapabilityManageContracts,
			CapabilityManageEquipment,
			CapabilityViewEmployees,
			CapabilityManageEmployees,
		},
	},
	RoleDivisionOperator: {
		Template:      RoleDivisionOperator,
		Label:         "Сотрудник дивизиона",
		AllowedScopes: []string{ScopeDivision},
	},
	RoleUnitHead: {
		Template:      RoleUnitHead,
		Label:         "Руководитель юнита",
		AllowedScopes: []string{ScopeUnit},
		Capabilities:  []Capability{CapabilityViewEmployees},
	},
	RoleUnitAdmin: {
		Template:      RoleUnitAdmin,
		Label:         "Администратор юнита",
		AllowedScopes: []string{ScopeUnit},
		Capabilities: []Capability{
			CapabilityManageStructure,
			CapabilityManageAccess,
			CapabilityManageContracts,
			CapabilityManageEquipment,
			CapabilityViewEmployees,
			CapabilityManageEmployees,
		},
	},
	RoleUnitOperator: {
		Template:      RoleUnitOperator,
		Label:         "Сотрудник юнита",
		AllowedScopes: []string{ScopeUnit},
	},
	RoleAuditor: {
		Template:        RoleAuditor,
		Label:           "Аудитор",
		AllowedScopes:   []string{ScopeOrganization, ScopeDivision, ScopeUnit},
		Capabilities:    []Capability{CapabilityViewEmployees},
		AuditorAnyScope: true,
	},
}

var allowedRoleTemplates = map[string]string{
	RoleOrganizationAdmin: roleCatalog[RoleOrganizationAdmin].Label,
	RoleOrganizationHead:  roleCatalog[RoleOrganizationHead].Label,
	RoleDivisionAdmin:     roleCatalog[RoleDivisionAdmin].Label,
	RoleDivisionHead:      roleCatalog[RoleDivisionHead].Label,
	RoleDivisionOperator:  roleCatalog[RoleDivisionOperator].Label,
	RoleUnitAdmin:         roleCatalog[RoleUnitAdmin].Label,
	RoleUnitHead:          roleCatalog[RoleUnitHead].Label,
	RoleUnitOperator:      roleCatalog[RoleUnitOperator].Label,
	RoleAuditor:           roleCatalog[RoleAuditor].Label,
}

func IsRoleScopeCompatible(roleTemplate string, scopeType string) bool {
	definition, ok := roleCatalog[roleTemplate]
	if !ok {
		return false
	}

	for _, allowedScope := range definition.AllowedScopes {
		if allowedScope == scopeType {
			return true
		}
	}
	return false
}

func HasCapability(session *SessionSummaryResponse, capability Capability) bool {
	if session == nil || session.Grant == nil || session.Organization.LaunchState != "active" {
		return false
	}
	return grantHasCapability(session.Grant.RoleTemplate, session.Workspace.ScopeType, capability)
}

func snapshotHasCapability(snapshot *sessionSnapshot, capability Capability) bool {
	if snapshot == nil || snapshot.SessionRow.OrganizationLaunchState != "active" {
		return false
	}
	return grantHasCapability(
		snapshot.SessionRow.GrantRoleTemplate,
		snapshot.SessionRow.GrantScopeType,
		capability,
	)
}

func grantHasCapability(roleTemplate string, scopeType string, capability Capability) bool {
	if !IsRoleScopeCompatible(roleTemplate, scopeType) {
		return false
	}

	for _, ownedCapability := range roleCatalog[roleTemplate].Capabilities {
		if ownedCapability == capability {
			return true
		}
	}
	return false
}
