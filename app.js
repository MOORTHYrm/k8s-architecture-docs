/**
 * K8s Production Architecture Pyramid — app.js
 * Handles: layer data, pyramid rendering, detail panel, legend
 */

/* ═══════════════════════════════════════════════════════════════
   LAYER DATA
   Each entry describes one tier of the pyramid (bottom → top).
   ═══════════════════════════════════════════════════════════════ */
const LAYERS = [
  /* ── 1. Infrastructure Foundation ─────────────────────────── */
  {
    id: 1,
    color: '#00e5ff',
    icon: '🏗️',
    name: 'Infrastructure Foundation',
    sub: 'VPC · Multi-AZ EKS · Nodes · Subnets · IAM · DNS',
    width: 500,
    height: 48,
    title: 'AWS EKS Infrastructure Foundation — Multi-AZ · VPC · Control Plane',
    desc:  'Core infrastructure: VPC with public/private subnets across 3 AZs, EKS managed control plane, node groups (On-Demand + Spot), IAM, Route 53 and ECR',
    cards: [
      {
        title: 'VPC & Subnets',
        items: [
          'VPC CIDR: 10.0.0.0/16',
          'Public  AZ-a: 10.0.0.0/24  (ALB, NAT)',
          'Public  AZ-b: 10.0.1.0/24',
          'Public  AZ-c: 10.0.2.0/24',
          'Private AZ-a: 10.0.10.0/24 (nodes)',
          'Private AZ-b: 10.0.11.0/24',
          'Private AZ-c: 10.0.12.0/24',
          'Database AZ-*: 10.0.20.0/24',
        ],
      },
      {
        title: 'EKS Control Plane',
        items: [
          'EKS 1.29 Managed Control Plane',
          'Multi-AZ: API server auto-spread',
          'etcd: 3 replicas (AWS managed)',
          'OIDC provider: auto-configured',
          'API endpoint: private + public',
          'Audit logging: CloudWatch Logs',
          'Envelope encryption: KMS',
          'Upgrade: managed rolling (zero downtime)',
        ],
      },
      {
        title: 'Node Groups',
        items: [
          'NG-system:  m5.xlarge  OD  (critical)',
          'NG-general: m5.xlarge  Spot (app)',
          'NG-memory:  r5.xlarge  Spot (DB)',
          'NG-arm:     m7g.xlarge Spot (arm64)',
          'Karpenter: dynamic NodePools',
          'Launch Template: custom AMI',
          'IMDSv2: required (security)',
          'Node termination handler DaemonSet',
        ],
      },
      {
        title: 'Public Subnet Services',
        items: [
          'Internet Gateway: inbound internet',
          'NAT Gateway: 1 per AZ (HA egress)',
          'AWS ALB: multi-AZ target groups',
          'Network Load Balancer: TCP/UDP',
          'WAF v2: OWASP + rate rules',
          'AWS Shield Standard: DDoS',
          'CloudFront: global edge cache',
          'Route 53: latency + health routing',
        ],
      },
      {
        title: 'AWS Service Integrations',
        items: [
          'ECR: private container registry',
          'Secrets Manager: app secrets',
          'SSM Parameter Store: config',
          'CloudWatch: metrics + logs + alarms',
          'S3: artifacts + backups + state',
          'SQS/SNS: async messaging',
          'RDS Aurora: managed PostgreSQL',
          'ElastiCache: managed Redis',
        ],
      },
      {
        title: 'IAM & Network Security',
        items: [
          'EKS node IAM role: minimal',
          'aws-auth ConfigMap → IAM groups',
          'Security Groups: node + ALB + RDS',
          'VPC Flow Logs: S3 + Athena query',
          'PrivateLink: ECR/S3/SM endpoints',
          'GuardDuty: threat detection',
          'CloudTrail: API audit logs',
          'Config: compliance drift detection',
        ],
      },
    ],
    az: [
      'Control Plane: AWS managed 3-AZ',
      'NAT Gateway: 1 per AZ (3 total)',
      'Node Groups: multi-AZ with ASG',
    ],
  },

  /* ── 2. Storage & Backup ────────────────────────────────────── */
  {
    id: 2,
    color: '#00bfa5',
    icon: '💾',
    name: 'Storage & Backup',
    sub: 'PV · PVC · CSI · StorageClass · Velero · EBS · EFS',
    width: 500,
    height: 44,
    title: 'Persistent Storage, CSI Drivers & Backup Strategy',
    desc:  'Dynamic volume provisioning via EBS/EFS CSI drivers, StatefulSet VolumeClaimTemplates, Velero scheduled backups and cross-region snapshot lifecycle',
    cards: [
      {
        title: 'StorageClasses',
        items: [
          'gp3: default block (reclaimPolicy:Retain)',
          'io2-nvme: IOPS:10000 (DB workloads)',
          'efs-sc: ReadWriteMany (shared assets)',
          's3-fuse: archive/ML datasets',
          'WaitForFirstConsumer: AZ binding',
          'allowVolumeExpansion: true (all)',
          'Encrypted: KMS key per env',
          'Throughput: gp3 125 MB/s default',
        ],
      },
      {
        title: 'PV / PVC Patterns',
        items: [
          'StatefulSet: volumeClaimTemplates',
          'Deployment: pre-provisioned PVC',
          'ReadWriteOnce: DB per pod',
          'ReadWriteMany: shared config/assets',
          'ReclaimPolicy: Retain (prod) Delete (dev)',
          'PVC expansion: no downtime (gp3)',
          'VolumeSnapshot: pre-upgrade backup',
          'CSI Migration: in-tree → EBS CSI',
        ],
      },
      {
        title: 'CSI Drivers',
        items: [
          'aws-ebs-csi-driver: gp3/io2 block',
          'aws-efs-csi-driver: NFS multi-AZ',
          'aws-fsx-csi-driver: Lustre HPC',
          'secrets-store-csi: SM/SSM mounts',
          'EBS: single-AZ ReadWriteOnce',
          'EFS: multi-AZ ReadWriteMany',
          'IOPS burst: io2 10K provisioned',
          'Throughput: 1000 MB/s io2',
        ],
      },
      {
        title: 'Velero Backup',
        items: [
          'Schedule: @daily full namespace',
          'Schedule: @hourly critical NS (prod)',
          'BackupStorageLocation: S3 us-west-2',
          'VolumeSnapshotLocation: EBS native',
          'TTL: 30 days prod · 7 days dev',
          'Include: all PVCs + K8s objects',
          'Exclude: kube-system · monitoring',
          'restoreHooks: migration scripts',
        ],
      },
      {
        title: 'StatefulSet HA',
        items: [
          'postgres: 3 replicas (1 primary, 2 replica)',
          'podManagementPolicy: Parallel',
          'updateStrategy: RollingUpdate',
          'Primary:   postgres-0 (AZ-a)',
          'Replica-1: postgres-1 (AZ-b)',
          'Replica-2: postgres-2 (AZ-c)',
          'Patroni: HA + auto-failover',
          'PgBouncer: connection pooling',
        ],
      },
      {
        title: 'Snapshot Lifecycle',
        items: [
          'EBS snapshot: @hourly  (retention 48h)',
          'EBS snapshot: @daily   (retention 30d)',
          'EBS snapshot: @weekly  (retention 1yr)',
          'Cross-region copy: us-west-2 backup',
          'S3 lifecycle: Glacier after 90d',
          'KMS encrypted: aws/ebs key',
          'Cost: ~$0.05/GB-month snapshot',
          'Instant restore from any snapshot',
        ],
      },
    ],
    az: [
      'EBS: AZ-a·b·c separate volumes',
      'EFS: single filesystem spans all AZs',
      'Velero: S3 cross-region replication',
    ],
  },

  /* ── 3. Security (Zero Trust) ──────────────────────────────── */
  {
    id: 3,
    color: '#ff1744',
    icon: '🔒',
    name: 'Security (Zero Trust)',
    sub: 'RBAC · mTLS · OPA · PSS · IRSA · Secrets · Falco',
    width: 500,
    height: 44,
    title: 'Security: Zero-Trust Architecture · RBAC · Secrets · Runtime',
    desc:  'Defence-in-depth: AWS IAM IRSA, K8s RBAC, Pod Security Standards, OPA Gatekeeper admission, Falco runtime detection and Vault secrets management',
    cards: [
      {
        title: 'RBAC Matrix',
        items: [
          'cluster-admin: SRE team only',
          'platform-engineer: deployments r/w',
          'dev-readonly: pods/logs get/list',
          'ci-deployer: SA deployments patch',
          'monitoring: SA metrics get',
          'secret-reader: SA secrets get',
          'All humans via SSO OIDC groups',
          'SA: dedicated per workload (no default)',
        ],
      },
      {
        title: 'Pod Security Standards',
        items: [
          'kube-system:  Privileged (platform)',
          'monitoring:   Baseline',
          'dev/stg:      Baseline',
          'production:   Restricted enforced',
          'runAsNonRoot: true (all prod)',
          'runAsUser: ≥1000 (all prod)',
          'readOnlyRootFilesystem: true',
          'allowPrivilegeEscalation: false',
        ],
      },
      {
        title: 'Secrets Management',
        items: [
          'Secrets Store CSI Driver',
          'AWS Secrets Manager backend',
          'External Secrets Operator',
          'No K8s Secrets plain text (prod)',
          'SecretProviderClass per app',
          'Auto-rotation: 30-day cycle',
          'Vault Sidecar Injector (option)',
          'Sealed Secrets for GitOps',
        ],
      },
      {
        title: 'IRSA (Pod IAM)',
        items: [
          'ServiceAccount annotated with ARN',
          'OIDC trust policy per SA',
          'Minimal IAM policy (least-priv)',
          'eks-node-role: EC2 describe only',
          'velero-role: S3 bucket scoped',
          'external-secrets-role: SM get only',
          'No static AWS credentials ever',
          'STS token lifetime: 3600s',
        ],
      },
      {
        title: 'Runtime Security',
        items: [
          'Falco DaemonSet: syscall audit',
          'Falco rules: exec in container',
          'Falco rules: write /etc /bin',
          'Alert: privileged container started',
          'Alert: K8s audit: secret access',
          'Trivy: CVE scan all images',
          'Trivy Operator: continuous scan',
          'Block: CRITICAL CVE images (OPA)',
        ],
      },
      {
        title: 'Network Zero Trust',
        items: [
          'Default deny-all NetworkPolicy',
          'Allow only declared flows',
          'mTLS: all service-to-service',
          'AuthorizationPolicy: method+path',
          'No public IPs on pods/nodes',
          'Private subnets only for nodes',
          'PrivateLink: AWS service access',
          'Egress: allowlist only (Cilium)',
        ],
      },
    ],
    az: [
      'IAM IRSA: regional OIDC endpoint',
      'Falco: DaemonSet all nodes all AZs',
      'Secrets Manager: regional HA endpoints',
    ],
  },

  /* ── 4. Networking & Service Mesh ──────────────────────────── */
  {
    id: 4,
    color: '#651fff',
    icon: '🕸️',
    name: 'Networking & Service Mesh',
    sub: 'Ingress · Istio · Cilium · mTLS · Traffic Mgmt',
    width: 500,
    height: 42,
    title: 'Networking, Ingress & Istio Service Mesh',
    desc:  '7-layer traffic management from Route 53 → ALB → Nginx Ingress → Istio Gateway → Envoy sidecars with full mTLS, circuit breaking and traffic shaping',
    cards: [
      {
        title: 'Ingress Stack',
        items: [
          'Route 53 → CloudFront → ALB',
          'WAF: OWASP Top 10 rules',
          'ACM: TLS termination at ALB',
          'Nginx Ingress Controller (L7)',
          'Rate limiting: 1000 rps/IP',
          'Basic Auth + OAuth2 Proxy',
          "cert-manager: Let's Encrypt",
          'Ingress HPA: 2-10 replicas',
        ],
      },
      {
        title: 'Istio Control Plane',
        items: [
          'Istiod: Pilot + Citadel + Galley',
          'PeerAuthentication: STRICT mTLS',
          'AuthorizationPolicy: deny-all default',
          'JWT validation at ingress gateway',
          'Kiali: service graph visibility',
          'Jaeger: automatic trace injection',
          'xDS push to all Envoy proxies',
          'Revision-based canary upgrades',
        ],
      },
      {
        title: 'Envoy Sidecar Config',
        items: [
          'Auto-injected via MutatingWebhook',
          'Intercepts all pod traffic (iptables)',
          'Circuit breaker: consecutive5xx:5',
          'outlierDetection: 30s ejection',
          'retryPolicy: 3× on 5xx',
          'connectionPool: maxPendingReqs:100',
          'timeout: 30s per request (global)',
          'localRateLimit: per-pod 500 rps',
        ],
      },
      {
        title: 'Traffic Management',
        items: [
          'VirtualService: canary 90/10 split',
          'VirtualService: fault injection (test)',
          'DestinationRule: ROUND_ROBIN LB',
          'DestinationRule: subset v1/v2',
          'EnvoyFilter: custom Lua scripts',
          'ServiceEntry: external egress',
          'Sidecar: restrict egress per pod',
          'Header-based routing: A/B testing',
        ],
      },
      {
        title: 'Cilium eBPF',
        items: [
          'Replaces kube-proxy (eBPF)',
          'CiliumNetworkPolicy: L3/L4/L7',
          'Identity-based (not IP-based)',
          'L7 HTTP: method + path match',
          'Hubble: L7 flow observability',
          'ClusterMesh: cross-cluster policy',
          'Bandwidth Manager: egress QoS',
          'DSR: Direct Server Return mode',
        ],
      },
      {
        title: 'Service Types',
        items: [
          'ClusterIP: internal (default)',
          'Headless: StatefulSet DNS (none)',
          'LoadBalancer: external via ALB CCM',
          'ExternalName: external DNS alias',
          'NodePort: debug/staging only',
          'EndpointSlice: replaces Endpoints',
          'ExternalDNS: auto Route53 records',
          'AWS Load Balancer Controller v2',
        ],
      },
    ],
    az: [
      'ALB: multi-AZ target groups',
      'Nginx Ingress: DaemonSet 1/node all AZs',
      'Istio Gateway: 2+ replicas spread AZ-a·b·c',
    ],
  },

  /* ── 5. Resource Constraints ────────────────────────────────── */
  {
    id: 5,
    color: '#ff6d00',
    icon: '📏',
    name: 'Resource Constraints',
    sub: 'LimitRange · ResourceQuota · QoS · Priority',
    width: 458,
    height: 42,
    title: 'Resource Governance: Quotas · Limits · QoS · Priority Classes',
    desc:  'Enforcing resource fairness with LimitRanges, ResourceQuotas per namespace, QoS classes and PriorityClasses for critical workload protection',
    cards: [
      {
        title: 'LimitRange (per NS)',
        items: [
          'default CPU request:    100m',
          'default CPU limit:      500m',
          'default Memory request: 128Mi',
          'default Memory limit:   512Mi',
          'max CPU per pod:         8',
          'max Memory per pod:     16Gi',
          'min CPU per container:   10m',
          'Enforced by Admission Webhook',
        ],
      },
      {
        title: 'ResourceQuota (per NS)',
        items: [
          'prod: CPU 64  / Memory 128Gi',
          'stg:  CPU 32  / Memory  64Gi',
          'dev:  CPU 16  / Memory  32Gi',
          'pods: max 200 per namespace',
          'services: max 50 per namespace',
          'PVCs: max 20 per namespace',
          'LoadBalancers: max 5 per NS',
          'ConfigMaps: max 100 per NS',
        ],
      },
      {
        title: 'QoS Classes',
        items: [
          'Guaranteed: req==limits (prod)',
          'Burstable: req<limits (stg)',
          'BestEffort: no req/limits (avoid!)',
          'Eviction order: BestEffort first',
          'Guaranteed: never evicted OOM',
          'Set on all prod pods: Guaranteed',
          'VPA respects QoS class',
          'OOM score adjusted per class',
        ],
      },
      {
        title: 'PriorityClass',
        items: [
          'system-cluster-critical: 2 000 000 000',
          'system-node-critical:    1 999 999 999',
          'platform-critical:           1 000 000',
          'application-high:              500 000',
          'application-default:           100 000',
          'batch-low:                      10 000',
          'Preemption: enabled for critical',
          'Non-preempting for batch jobs',
        ],
      },
      {
        title: 'OPA / Gatekeeper',
        items: [
          'K8sRequiredLabels: app,team,env',
          'K8sNoPrivileged: deny privileged',
          'K8sBlockNodePort: no NodePort prod',
          'K8sRequiredResources: always set',
          'K8sAllowedRepos: ECR only',
          'K8sBlockLatestTag: require SHA/semver',
          'ConstraintTemplate: Rego policies',
          'Audit mode: daily violation report',
        ],
      },
      {
        title: 'Namespace Strategy',
        items: [
          'production:   strict quotas + PSS',
          'staging:      moderate quotas',
          'development:  loose + scale-to-zero',
          'kube-system:  no quota (platform)',
          'monitoring:   dedicated namespace',
          'istio-system: dedicated namespace',
          'cert-manager: dedicated namespace',
          'Labels: cost-center, team, env',
        ],
      },
    ],
    az: [
      'ResourceQuota: applied cluster-wide',
      'LimitRange: per-AZ node affinity respected',
      'QoS Guaranteed: survive AZ node pressure',
    ],
  },

  /* ── 6. Autoscaling ─────────────────────────────────────────── */
  {
    id: 6,
    color: '#00e676',
    icon: '📈',
    name: 'Autoscaling',
    sub: 'HPA · VPA · Karpenter · KEDA · Node Autoscaler',
    width: 410,
    height: 42,
    title: 'Full Autoscaling Stack: Pod · Node · Scheduled · Vertical',
    desc:  'Multi-dimensional autoscaling from pod replicas (HPA) to node provisioning (Karpenter) to vertical rightsizing (VPA) and event-driven scaling (KEDA)',
    cards: [
      {
        title: 'HPA — CPU/Memory',
        items: [
          'targetCPUUtilizationPct: 70%',
          'targetMemoryUtilizationPct: 80%',
          'minReplicas: 2  (prod: 5)',
          'maxReplicas: 50',
          'scaleUp   stabilization: 0s',
          'scaleDown stabilization: 300s',
          'scaleUp:   +100% per 60s max',
          'scaleDown: -10%  per 120s max',
        ],
      },
      {
        title: 'HPA — Custom Metrics',
        items: [
          'Prometheus Adapter → Custom API',
          'metric: http_requests_per_second',
          'target: 1000 rps per pod',
          'metric: queue_depth (SQS/RabbitMQ)',
          'target: 100 messages per pod',
          'External metrics: AWS SQS depth',
          'KEDA ScaledObject overrides HPA',
          'Combined CPU + custom metrics',
        ],
      },
      {
        title: 'VPA — Vertical',
        items: [
          'updateMode: Auto (dev) / Off (prod)',
          'minAllowed:  50m / 64Mi',
          'maxAllowed:  8 CPU / 16Gi',
          'containerResourcePolicy per pod',
          'Goldilocks UI recommendation',
          'Weekly VPA report via Slack',
          'Never run VPA+HPA on same metric',
          'Admission controller updates at start',
        ],
      },
      {
        title: 'Karpenter Node Autoscaler',
        items: [
          'NodePool: spot-general + od-critical',
          'EC2NodeClass: multi-AZ subnets',
          'Consolidation: WhenUnderutilized',
          'consolidationPolicy: WhenEmpty',
          'disruption: budgets per NodePool',
          'ttlSecondsAfterEmpty: 30s',
          'Bin-packing: largest fitting instance',
          'Graviton preferred if arm64 pods',
        ],
      },
      {
        title: 'KEDA Event-Driven',
        items: [
          'ScaledObject: Kafka consumer lag',
          'ScaledObject: RabbitMQ queue depth',
          'ScaledObject: Cron (day/night)',
          'ScaledObject: Prometheus query',
          'ScaleToZero in dev/stg off-peak',
          'pollingInterval: 30s',
          'cooldownPeriod: 300s',
          'fallback: minReplicas if metrics fail',
        ],
      },
      {
        title: 'Cluster Autoscaler (legacy)',
        items: [
          'Runs alongside Karpenter (separate NG)',
          'expanderStrategy: least-waste',
          'scale-down-delay: 10min',
          'skip-nodes-with-system-pods: true',
          'Balance similar node groups',
          'Max nodes: 50 per node group',
          'Scan interval: 10s',
          'Expander: price (Spot) for cost',
        ],
      },
    ],
    az: [
      'Karpenter: NodePool with AZ topology',
      'HPA pods: topologySpread AZ-a·b·c',
      'Spot interruption: re-schedule to free AZ',
    ],
  },

  /* ── 7. Workloads (3 Envs) ──────────────────────────────────── */
  {
    id: 7,
    color: '#2979ff',
    icon: '📦',
    name: 'Workloads (3 Envs)',
    sub: 'Dev · Staging · Production · StatefulSets · GitOps',
    width: 350,
    height: 42,
    title: 'Workloads Across 3 Environments: Dev → Staging → Production',
    desc:  'ArgoCD GitOps ApplicationSets driving Deployments, StatefulSets and DaemonSets across Dev/Stg/Prod with per-env config overlays',
    cards: [
      {
        title: 'Dev Environment',
        items: [
          'Branch: feature/* | develop',
          'Auto-sync: ArgoCD ON',
          'Replicas: 1-2 (no HPA)',
          'Resources: 100m / 128Mi',
          'Nginx Ingress: dev.co.com',
          'NetworkPolicy: relaxed',
          'RBAC: dev-team ReadWrite',
          'Scale-to-zero off-hours (KEDA)',
        ],
      },
      {
        title: 'Staging Environment',
        items: [
          'Branch: release/* | main',
          'Auto-sync: ArgoCD ON',
          'HPA: min:3 max:10 @ 70% CPU',
          'Resources: 250m / 256Mi',
          'Nginx Ingress: stg.co.com',
          'Istio canary: 90/10 split',
          'E2E + k6 perf gates',
          'RBAC: qa-team + platform',
        ],
      },
      {
        title: 'Production Environment',
        items: [
          'Branch: main (post-approval)',
          'Sync: Manual approval required',
          'HPA: min:5 max:50 @ 70% CPU',
          'Resources: 500m / 512Mi',
          'ALB Ingress: co.com + WAF',
          'Istio mTLS + circuit breaker',
          'PDB: minAvailable:2',
          'RBAC: restricted + audit log',
        ],
      },
      {
        title: 'Deployment Topology',
        items: [
          'Deployment: stateless services',
          'StatefulSet: DB (postgres HA)',
          'DaemonSet: Fluent Bit log agent',
          'CronJob: backup · report · cleanup',
          'Job: DB migrations (pre-hook)',
          'ReplicaSet: managed by Deployment',
          'PodDisruptionBudget: all prod',
          'HorizontalPodAutoscaler: all prod',
        ],
      },
      {
        title: 'GitOps ArgoCD',
        items: [
          'ApplicationSet per environment',
          'Helm values overlay per env',
          'Kustomize base + patch pattern',
          'Drift detection: auto-correct',
          'Rollback = git revert + sync',
          'App-of-apps pattern for platform',
          'Image updater: ECR tag tracking',
          'Webhook: GitHub → ArgoCD sync',
        ],
      },
      {
        title: 'Container Standards',
        items: [
          'Multi-arch: linux/amd64+arm64',
          'Non-root user: UID 1000',
          'readOnlyRootFilesystem: true',
          'Drop ALL capabilities',
          'livenessProbe + readinessProbe',
          'startupProbe: slow-start apps',
          'Resources always set (all pods)',
          'Security Context: non-root enforced',
        ],
      },
    ],
    az: [
      'Pods anti-affinity: spread AZ-a·b·c',
      'StatefulSet: 1 pod per AZ (3 replicas)',
      'DaemonSet: 1 pod per node all AZs',
    ],
  },

  /* ── 8. Observability ──────────────────────────────────────── */
  {
    id: 8,
    color: '#ffd740',
    icon: '📊',
    name: 'Observability',
    sub: 'Prometheus · Grafana · Jaeger · Loki · Alerting',
    width: 280,
    height: 42,
    title: 'Observability: Metrics · Logs · Traces · Alerting',
    desc:  'Full-stack observability with Prometheus, Grafana dashboards, distributed tracing via Jaeger, log aggregation via Loki and PagerDuty alerting',
    cards: [
      {
        title: 'Prometheus Stack',
        items: [
          'kube-prometheus-stack Helm chart',
          'ServiceMonitor per workload',
          'PrometheusRule: alert definitions',
          'Thanos Sidecar for long-term storage',
          'Remote-write to Thanos Compactor',
          'Retention: 15d local · 1yr Thanos',
        ],
      },
      {
        title: 'Grafana Dashboards',
        items: [
          'K8s cluster overview (Node Exporter)',
          'HPA scaling dashboard',
          'Istio service mesh topology',
          'Cost per namespace (Kubecost)',
          'SLO/SLI burn-rate dashboards',
          'Custom app metrics panels',
        ],
      },
      {
        title: 'Distributed Tracing',
        items: [
          'Jaeger all-in-one deployment',
          'Istio automatic trace injection',
          'B3 propagation headers',
          '100% sampling dev · 5% prod',
          'Trace retention: 7 days',
          'Tempo as alternative backend',
        ],
      },
      {
        title: 'Log Aggregation',
        items: [
          'Loki + Promtail DaemonSet',
          'Fluent Bit: JSON structured logs',
          'S3 long-term log archive',
          'Log retention: 30d hot · 1yr cold',
          'Correlation: traceID in logs',
          'Grafana unified log/trace view',
        ],
      },
      {
        title: 'Alerting',
        items: [
          'AlertManager: route + silence',
          'PagerDuty for P0/P1 critical',
          'Slack #alerts for P2/P3',
          'Dead-man-switch heartbeat',
          'Inhibition rules: dep alerts',
          'SLO burn-rate multi-window',
        ],
      },
      {
        title: 'SLOs & Error Budgets',
        items: [
          'SLO: 99.9% availability',
          'Error budget: 43.8 min/month',
          'Burn rate alerts: 1x · 6x · 14x',
          'Sloth for SLO generation',
          'Weekly error budget report',
          'Freeze deployments at 50% burn',
        ],
      },
    ],
    az: [
      'Prometheus HA: 2 replicas per AZ',
      'Thanos Query: multi-AZ federation',
      'Loki: S3 backend multi-AZ',
    ],
  },

  /* ── 9. Disaster Recovery ──────────────────────────────────── */
  {
    id: 9,
    color: '#ff4081',
    icon: '🆘',
    name: 'Disaster Recovery',
    sub: 'RPO/RTO · Active-Active · Velero · GitOps Restore',
    width: 200,
    height: 42,
    title: 'Disaster Recovery & Business Continuity',
    desc:  'Four DR tiers from Active-Active (RPO:0) through Warm Standby, Pilot Light to Backup & Restore with automated runbooks',
    cards: [
      {
        title: 'Active-Active (Tier 1)',
        items: [
          'RPO: 0  ·  RTO: <1 min',
          'Dual clusters: us-east-1 + eu-west-1',
          'Route 53 Latency + Health routing',
          'Aurora Global DB: lag <1s',
          'Istio cross-cluster load balancing',
          'Automatic DNS flip on health fail',
        ],
      },
      {
        title: 'Warm Standby (Tier 2)',
        items: [
          'RPO: 15min  ·  RTO: <30min',
          'Standby at 25% capacity',
          'Continuous DB replication',
          'CloudWatch alarm → Lambda scale-up',
          'GitOps auto-syncs manifests',
          'DB read-replica promotion <5min',
        ],
      },
      {
        title: 'Pilot Light (Tier 3)',
        items: [
          'RPO: 1h  ·  RTO: <4h',
          'Core services only running',
          'EBS snapshots every 1h lifecycle',
          'Terraform full rebuild <30min',
          'Velero restore from S3 backup',
          'Runbook fully automated',
        ],
      },
      {
        title: 'Backup & Restore (Tier 4)',
        items: [
          'RPO: 24h  ·  RTO: <24h',
          'Git repo = source of truth',
          'Velero cross-region daily backup',
          'S3 → Glacier after 90 days',
          'Full cluster rebuild via Helm',
          '30-day backup TTL policy',
        ],
      },
      {
        title: 'Velero Config',
        items: [
          'Schedule: @daily full cluster',
          'VolumeSnapshots: EBS snapshots',
          'BackupStorageLocation: S3',
          'BackupLocation: us-west-2 replica',
          'Namespace exclude: kube-system',
          'restoreHooks: post-restore jobs',
        ],
      },
      {
        title: 'Automated Failover',
        items: [
          'Route 53 health checks 10s',
          'Unhealthy threshold: 2 checks',
          'Lambda triggers ASG scale-up',
          'ArgoCD sync on target cluster',
          'PagerDuty alert + Slack #incidents',
          'Full runbook in Confluence',
        ],
      },
    ],
    az: [
      'Primary: AZ-a·b·c  us-east-1',
      'Secondary: AZ-a·b·c  eu-west-1',
      'Backup: S3 cross-region replica',
    ],
  },

  /* ── 10. Cost & Governance ──────────────────────────────────── */
  {
    id: 10,
    color: '#76ff03',
    icon: '💰',
    name: 'Cost & Governance',
    sub: 'Savings · Chargeback · Guardrails',
    width: 120,
    height: 38,
    title: 'Cost Optimisation & Governance',
    desc:  'Spot strategy · Graviton · Kubecost chargeback · Reserved Instances · Resource Governance',
    cards: [
      {
        title: 'Spot Strategy',
        items: [
          'Karpenter NodePool: spot-first',
          '4 instance family diversification',
          'm5/m6i/c5/r5 pools per AZ',
          '2-min interruption drain handler',
          'On-Demand fallback automatic',
          'Saves 60-70% vs On-Demand',
        ],
      },
      {
        title: 'Graviton / ARM',
        items: [
          'm7g · c7g · r7g instances',
          '40% cheaper than x86',
          'Multi-arch Docker images',
          'nodeSelector: arm64',
          'Mixed: ARM Spot + x86 OD',
          'CI builds: QEMU emulation',
        ],
      },
      {
        title: 'Rightsizing',
        items: [
          'VPA: Auto mode recommendations',
          'Goldilocks per-namespace',
          'LimitRange default 100m/128Mi',
          'ResourceQuota: 16CPU/32Gi NS',
          'requests == limits (Guaranteed QoS)',
          'Weekly rightsizing report',
        ],
      },
      {
        title: 'KEDA Scheduling',
        items: [
          'ScaleToZero dev/stg off-hours',
          'CronTrigger: 08:00-19:00 weekdays',
          'Saves 60% dev cluster cost',
          'ScaledObject per workload',
          'KEDA metrics from Prometheus',
          'Cooldown: 300s before scale-in',
        ],
      },
      {
        title: 'Kubecost Chargeback',
        items: [
          'Label: cost-center=<team>',
          'Per-namespace cost allocation',
          'Daily Slack spend digest',
          'AWS Cost Anomaly Detection',
          'Chargeback to BU teams',
          'Budget alerts at 80% threshold',
        ],
      },
      {
        title: 'Reserved + Savings Plans',
        items: [
          '1-yr Compute Savings Plan',
          'Baseline On-Demand reserved',
          '~40% RI · ~66% 3yr SP',
          'Spot for burstable workloads',
          'Fargate for serverless jobs',
          'Total target: <$0.02 per vCPU-hr',
        ],
      },
    ],
    az: [
      'Spot Pools: m5.xl·c5.xl·r5.xl',
      'Graviton: m7g Spot pools',
      'RI: On-Demand baseline m5.2xl',
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════════════════ */
let activeLayerId = null;

/* ═══════════════════════════════════════════════════════════════
   PYRAMID BUILDER
   ═══════════════════════════════════════════════════════════════ */
function buildPyramid() {
  const wrap = document.getElementById('pyramid');

  LAYERS.forEach((layer, i) => {
    const el = document.createElement('div');
    el.className = 'p-layer';
    el.id = 'layer-' + layer.id;

    // Inline styles that depend on data
    Object.assign(el.style, {
      width:      layer.width + 'px',
      height:     layer.height + 'px',
      background: `linear-gradient(135deg, ${layer.color}22, ${layer.color}44)`,
      border:     `1px solid ${layer.color}60`,
      boxShadow:  `0 2px 20px ${layer.color}20`,
      opacity:    '0',
      transform:  'scaleX(0.5)',
      transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1), filter 0.2s, box-shadow 0.2s',
    });

    el.innerHTML = `
      <div class="p-layer-inner">
        <span class="layer-icon">${layer.icon}</span>
        <div>
          <div class="layer-name" style="color:${layer.color}">${layer.name}</div>
          <div class="layer-sub">${layer.sub}</div>
        </div>
      </div>`;

    // Staggered entrance animation
    setTimeout(() => {
      el.style.opacity   = '1';
      el.style.transform = 'scaleX(1)';
    }, 100 + i * 60);

    el.addEventListener('click', () => toggleDetail(layer, el));
    wrap.appendChild(el);
  });
}

/* ═══════════════════════════════════════════════════════════════
   DETAIL PANEL
   ═══════════════════════════════════════════════════════════════ */
function toggleDetail(layer, el) {
  const mount = document.getElementById('detailMount');

  // Collapse if same layer clicked again
  if (activeLayerId === layer.id) {
    mount.innerHTML = '';
    activeLayerId = null;
    document.querySelectorAll('.p-layer').forEach(l => l.classList.remove('active-layer'));
    return;
  }

  activeLayerId = layer.id;
  document.querySelectorAll('.p-layer').forEach(l => l.classList.remove('active-layer'));
  el.classList.add('active-layer');

  /* ── Build panel DOM ── */
  const panel = document.createElement('div');
  panel.className = 'detail-panel';
  Object.assign(panel.style, {
    borderColor: layer.color + '40',
    background:  `linear-gradient(135deg, ${layer.color}08, #050c14 60%)`,
  });

  // Header
  const header = document.createElement('div');
  header.className = 'dp-header';
  header.style.background = `linear-gradient(90deg, ${layer.color}18, transparent)`;
  header.innerHTML = `
    <span class="dp-icon">${layer.icon}</span>
    <div>
      <div class="dp-title" style="color:${layer.color}">${layer.title}</div>
      <div class="dp-desc">${layer.desc}</div>
    </div>`;

  // Cards grid
  const body = document.createElement('div');
  body.className = 'dp-body';

  layer.cards.forEach(card => {
    const c = document.createElement('div');
    c.className = 'dp-card';
    c.style.borderLeftColor = layer.color;
    c.innerHTML = `
      <div class="dp-card-title" style="color:${layer.color}">${card.title}</div>
      <ul>${card.items.map(item => `<li>${item}</li>`).join('')}</ul>`;
    body.appendChild(c);
  });

  // Multi-AZ strip
  const azStrip = document.createElement('div');
  azStrip.className = 'az-strip';

  ['AZ-a', 'AZ-b', 'AZ-c'].forEach((az, i) => {
    const zone = document.createElement('div');
    zone.className = 'az-zone';
    zone.innerHTML = `
      <div class="az-zone-label">☁ ${az}</div>
      <div class="az-zone-items">${layer.az[i] || layer.az[0]}</div>`;
    azStrip.appendChild(zone);
  });

  panel.appendChild(header);
  panel.appendChild(body);
  panel.appendChild(azStrip);

  mount.innerHTML = '';
  mount.appendChild(panel);

  // Smooth scroll to detail
  setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
}

/* ═══════════════════════════════════════════════════════════════
   LEGEND BUILDER
   ═══════════════════════════════════════════════════════════════ */
function buildLegend() {
  const legendEl = document.getElementById('legend');

  // Show bottom → top (reverse so Foundation is leftmost)
  [...LAYERS].reverse().forEach(layer => {
    const item = document.createElement('div');
    item.className = 'leg-item';
    item.innerHTML = `
      <div class="leg-dot" style="background:${layer.color}"></div>
      ${layer.name}`;

    item.addEventListener('click', () => {
      const layerEl = document.getElementById('layer-' + layer.id);
      if (layerEl) {
        layerEl.click();
        layerEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    legendEl.appendChild(item);
  });
}

/* ═══════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════ */
buildPyramid();
buildLegend();
