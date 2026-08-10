# 🗄️ AWS RDS Aurora MySQL Cluster Module

This module provisions a High-Availability Amazon Aurora MySQL Cluster across Multi-AZ Private DB Subnets:

- **Cluster Compute Nodes**: 2x `db.t4g.medium` instances (1 Writer + 1 Reader across `us-west-2a` and `us-west-2b`).
- **Storage Encryption**: Storage encrypted at rest with AWS KMS managed keys.
- **SSM Parameter Integration**: Automatically exports `db_host` (Writer Endpoint), `db_reader_host` (Reader Endpoint), `db_name`, `db_user`, and `db_password` to SSM Parameter Store.
