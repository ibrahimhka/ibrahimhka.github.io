---
title: "I Replaced Cloud Hosting With a Dell R730 and a GPU"
date: "June 15, 2026"
description: "Multiple production workloads, autonomous AI agents, and a full GitOps pipeline — running on bare-metal Kubernetes in a self-hosted rack."
---

# I Replaced Cloud Hosting With a Dell R730 and a GPU — Here's the Full Stack

*Multiple production workloads, autonomous AI agents, and a full GitOps pipeline — running on bare-metal Kubernetes in a self-hosted rack.*

---

There is a point where cloud bills and cloud abstractions become the same problem. You pay to not think about infrastructure, and then you spend all your time thinking about infrastructure anyway — just someone else's.

A few months ago I decommissioned a cloud VPS cluster and moved everything to a Dell PowerEdge R730. This is what that looks like today.

---

## The Hardware

A single Dell PowerEdge R730 runs everything. The specs matter:

- **128 GB DDR4 ECC RAM**
- **NVIDIA Tesla P40** (24 GB GDDR5X) — a data-centre card from 2016 that costs ~€200 used and outperforms most consumer GPUs for ML inference
- **iDRAC 8** — out-of-band management, remote KVM, power cycling, all without touching the physical machine
- **VMware ESXi 7** — three VMs carved from the host, each mapped to a Kubernetes node role

Three VMs. One control plane, two workers. The GPU-bearing worker is tainted so only GPU-requesting workloads land there. The hypervisor layer adds flexibility — VM snapshots, live migration capability, clean resource isolation between nodes — without giving up the performance of local NVMe storage.

---

## Kubernetes: v1.36.1, Vanilla

The cluster runs **Kubernetes v1.36.1**, bootstrapped with kubeadm. No managed Kubernetes, no abstraction layer on top. That means full control over every API, admission webhook, node configuration, and network policy.

The key infrastructure choices:

**Calico CNI** — full NetworkPolicy enforcement between namespaces. Tenants are isolated at the kernel level; one product's pods cannot reach another's regardless of what runs inside them.

**MetalLB** — bare-metal load balancer. Allocates a dedicated cluster IP to the ingress controller with no cloud provider required — a single entry point, clean routing.

**Traefik as ingress** — every workload owns its own `IngressRoute` CRD. No shared Ingress objects, no risk of one tenant's routing config breaking another. TLS is automatic via Let's Encrypt. All exposed domains are HTTPS with auto-renewing certificates.

**CloudNativePG** — the Postgres operator that treats database clusters as first-class Kubernetes resources. Declarative Postgres, backup-aware, with proper primary/replica lifecycle managed by the operator.

**Sealed Secrets** — all Kubernetes Secrets in git are encrypted `SealedSecret` objects. The private key lives only in the cluster. Raw secrets never appear in version control, CI logs, or chat history.

---

## GitOps: No `kubectl apply` in Production

The pipeline from code to running pod is entirely automated and entirely auditable.

```
git push
  → GitHub webhook
    → Argo Events (in-cluster receiver)
      → Argo Workflows (buildkitd builds OCI image)
        → image pushed to container registry
          → Workflow commits image tag bump to GitOps repo
            → ArgoCD detects diff
              → ArgoCD syncs → pods roll out
```

**ArgoCD** is the reconciler. It watches the git repository and continuously compares desired state (git) to live state (cluster). Any drift — a pod that restarts on an old image, a config that was manually edited — gets flagged and corrected.

**Argo Workflows + Argo Events** replace GitHub Actions for build and deploy. The build runs *inside the cluster* using `buildkitd` (rootless, Docker-free OCI image builder). An in-cluster event bus handles webhook-to-workflow delivery. Every build run has full DAG visualisation, logs, and retry history.

The result: a PR merge triggers the full pipeline in under two minutes. Every production change has a git commit as its source of truth. Rollback is `git revert` + push.

---

## What's Running

The cluster hosts several production applications across isolated namespaces. One is a data-intensive platform running autonomous AI agents continuously. Another is a real-time communication product where humans and AI meet in the same room. Each tenant owns its own identity layer, storage, and event bus — nothing is shared across product boundaries.

Beyond the applications, the platform layer itself is substantial: GitOps tooling, an in-cluster CI/CD engine, secrets management, networking, and GPU scheduling all run as workloads on the same cluster.

---

## Multi-Tenancy by Design

The cluster has 22 namespaces. Each product gets its own namespace set, its own identity provider, its own secrets, and its own ArgoCD Application. NetworkPolicies enforce isolation at the network layer. No tenant can reach another tenant's pods or data.

This is deliberate: the cluster is a platform, not a monolith. Adding a product means creating a namespace. Removing one means deleting it. Neither operation affects the other tenants.

---

## The Numbers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                             INTERNET                                     │
└─────────────────────────────────────────────────────────────────────────┘
              DNS  ·  public domains  ·  TLS via Let's Encrypt
┌─────────────────────────────────────────────────────────────────────────┐
│              MetalLB  →  Traefik Ingress  ·  13 IngressRoutes           │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────┬──────────────────────┬────────────────────────┐
│         tenant A         │       tenant B        │       platform        │
├─────────────────────────┼──────────────────────┼────────────────────────┤
│  data platforms          │  real-time meetings   │  GitOps · CI/CD       │
│  autonomous AI agents    │  event streaming      │  networking · security │
└─────────────────────────┴──────────────────────┴────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│                       Kubernetes  v1.36.1                                │
│           22 namespaces  ·  78 pods  ·  17 PVCs  ·  13 domains          │
└─────────────────────────────────────────────────────────────────────────┘
┌───────────────────────┬──────────────────────────┬──────────────────────┐
│    control-plane       │        worker-01          │      worker-02       │
│  4 vCPU  ·  7 GB RAM  │  8 vCPU  ·  19 GB RAM     │  8 vCPU · 30 GB RAM │
│  API server · etcd     │  General workloads        │  Tesla P40  24 GB   │
└───────────────────────┴──────────────────────────┴──────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│                    VMware ESXi 7  ·  iDRAC 8                             │
├─────────────────────────────────────────────────────────────────────────┤
│                     Dell PowerEdge R730                                  │
│          128 GB DDR4 ECC  ·  NVIDIA Tesla P40 (24 GB)  ·  iDRAC 8       │
└─────────────────────────────────────────────────────────────────────────┘
```

| Metric | Count |
|---|---|
| Physical servers | 1 |
| VMs / Kubernetes nodes | 3 |
| Total pods running | **78** |
| Namespaces | **22** |
| Deployments | **41** |
| StatefulSets | **12** |
| DaemonSets | **5** |
| Persistent Volume Claims | **17** |
| TLS-terminated domains | **13** |
| GPU (Tesla P40, 24 GB) | 1 |

---

## What This Replaces

The previous setup was a cloud VPS cluster — rented VMs, managed load balancer, object storage billed by request. The R730 hardware cost was recouped within months of decommissioning those resources. The tradeoff is operational responsibility: connectivity and hardware are yours to manage. For infrastructure at this scale, that's an acceptable tradeoff — especially with iDRAC providing out-of-band recovery without physical access.

The more interesting tradeoff is complexity. Running kubeadm, Calico, MetalLB, Traefik, ArgoCD, Argo Workflows, Argo Events, Sealed Secrets, CNPG, and the NVIDIA device plugin is a lot of moving parts. The payoff is that every one of those parts is understood, documented, and owned — not abstracted behind a managed service whose internals are opaque.

---

## What's Next

Layer 2 extends the platform with WebRTC TURN infrastructure for NAT traversal and hardens the event streaming layer. DNS and infrastructure-as-code are already written and applied. The self-hosted cluster is the only production environment.

The cluster tracks Kubernetes upstream releases as they ship.

---

