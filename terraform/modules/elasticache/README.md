# ⚡ AWS ElastiCache Redis Module

This module provisions an in-memory AWS ElastiCache Redis 7.1 cluster in Multi-AZ Private DB Subnets:

- **Compute Node**: `cache.t4g.micro` (ARM-based Graviton2 processor, 0.5 GiB RAM).
- **Subnet Placement**: Private DB Subnets across `us-west-2a` and `us-west-2b`.
- **Security**: Inbound TCP Port 6379 restricted ONLY to EC2 Application security group (`app-sg`).
- **SSM Parameter Store Integration**: Exports `/enterprise-expense-app/dev/redis_host` and `/redis_port` to AWS SSM Parameter Store.
