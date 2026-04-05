/**
 * Permission Classifier - Claude Code Architecture Pattern
 * Analyzes FAF operations for risk and required permissions
 */

import { PermissionLevel, RiskLevel } from './mcp-tools.js';

export interface OperationAnalysis {
  permission: PermissionLevel;
  risk: RiskLevel;
  reasons: string[];
  allowAutoApproval: boolean;
  requiresConfirmation: boolean;
}

export class PermissionClassifier {
  /**
   * Classify FAF operation based on Claude Code's risk assessment patterns
   */
  static classify(operation: string, params: Record<string, any> = {}): OperationAnalysis {
    // Read-only operations (Plan level)
    if (this.isReadOnly(operation, params)) {
      return {
        permission: PermissionLevel.Plan,
        risk: RiskLevel.Safe,
        reasons: ['Read-only operation', 'No file modifications'],
        allowAutoApproval: true,
        requiresConfirmation: false
      };
    }
    
    // Safe configuration operations (Auto level)
    if (this.isSafeConfig(operation, params)) {
      return {
        permission: PermissionLevel.Auto,
        risk: RiskLevel.Low,
        reasons: ['Safe configuration change', 'Limited scope'],
        allowAutoApproval: true,
        requiresConfirmation: false
      };
    }
    
    // File creation/modification (Standard level)
    if (this.isFileOperation(operation, params)) {
      const overwrite = params.force || params.overwrite;
      return {
        permission: PermissionLevel.Standard,
        risk: overwrite ? RiskLevel.Medium : RiskLevel.Low,
        reasons: [
          'File operation',
          overwrite ? 'May overwrite existing files' : 'Creates new files'
        ],
        allowAutoApproval: false,
        requiresConfirmation: true
      };
    }
    
    // High-risk operations (Bypass level)
    if (this.isHighRisk(operation, params)) {
      return {
        permission: PermissionLevel.Bypass,
        risk: RiskLevel.High,
        reasons: ['High-risk operation', 'Requires manual approval'],
        allowAutoApproval: false,
        requiresConfirmation: true
      };
    }
    
    // Default: Standard with confirmation
    return {
      permission: PermissionLevel.Standard,
      risk: RiskLevel.Medium,
      reasons: ['Unknown operation type', 'Requires confirmation'],
      allowAutoApproval: false,
      requiresConfirmation: true
    };
  }
  
  /**
   * Check if operation is read-only
   */
  private static isReadOnly(operation: string, params: Record<string, any>): boolean {
    const readOnlyOps = [
      'faf_score',
      'faf_info', 
      'faf_formats',
      'faf_check',
      'faf_validate'
    ];
    
    // Score operation is always read-only
    if (readOnlyOps.includes(operation)) {
      return true;
    }
    
    // Check for read-only flags
    if (params.dryRun || params.validate || params.check) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if operation is safe configuration
   */
  private static isSafeConfig(operation: string, params: Record<string, any>): boolean {
    const safeConfigOps = [
      'faf_sync',
      'faf_export',
      'faf_convert'
    ];
    
    if (safeConfigOps.includes(operation)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if operation involves file creation/modification
   */
  private static isFileOperation(operation: string, params: Record<string, any>): boolean {
    const fileOps = [
      'faf_init',
      'faf_auto',
      'faf_edit',
      'faf_migrate'
    ];
    
    if (fileOps.includes(operation)) {
      return true;
    }
    
    // Check for file modification flags
    if (params.output || params.write || params.save) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if operation is high-risk
   */
  private static isHighRisk(operation: string, params: Record<string, any>): boolean {
    const highRiskOps = [
      'faf_compile',
      'faf_execute',
      'faf_deploy'
    ];
    
    if (highRiskOps.includes(operation)) {
      return true;
    }
    
    // Check for high-risk flags
    if (params.execute || params.deploy || params.publish) {
      return true;
    }
    
    // Force overwrite is higher risk
    if (params.force && (params.overwrite || params.delete)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Get permission requirements for current context
   */
  static getRequiredPermission(
    analysis: OperationAnalysis,
    context: { hasExistingFiles?: boolean; isProduction?: boolean }
  ): PermissionLevel {
    let required = analysis.permission;
    
    // Elevate permission if overwriting existing files
    if (context.hasExistingFiles && required === PermissionLevel.Standard) {
      required = PermissionLevel.Auto;
    }
    
    // Production environments require higher permissions
    if (context.isProduction && required < PermissionLevel.Standard) {
      required = PermissionLevel.Standard;
    }
    
    return required;
  }
  
  /**
   * Check if operation should trigger confirmation dialog
   */
  static shouldConfirm(
    analysis: OperationAnalysis,
    userPermissionLevel: PermissionLevel
  ): boolean {
    // Always confirm if explicitly required
    if (analysis.requiresConfirmation) {
      return true;
    }
    
    // Confirm if user's permission level is lower than required
    const permissionOrder = [
      PermissionLevel.Plan,
      PermissionLevel.Standard,
      PermissionLevel.Auto, 
      PermissionLevel.Bypass
    ];
    
    const userIndex = permissionOrder.indexOf(userPermissionLevel);
    const requiredIndex = permissionOrder.indexOf(analysis.permission);
    
    return userIndex < requiredIndex;
  }
}