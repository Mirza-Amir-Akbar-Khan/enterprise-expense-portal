output "vpc_id" {
  description = "The ID of the provisioned Virtual Private Cloud (VPC)."
  value       = aws_vpc.this.id
}

output "vpc_cidr" {
  description = "The IPv4 CIDR block of the VPC."
  value       = aws_vpc.this.cidr_block
}

output "public_subnet_ids" {
  description = "List of IDs of the public subnets."
  value       = aws_subnet.public[*].id
}

output "private_app_subnet_ids" {
  description = "List of IDs of the private application subnets."
  value       = aws_subnet.private_app[*].id
}

output "private_db_subnet_ids" {
  description = "List of IDs of the private database subnets."
  value       = aws_subnet.private_db[*].id
}

output "nat_gateway_ips" {
  description = "List of public IP addresses of the Elastic IPs attached to the NAT Gateways."
  value       = aws_eip.nat[*].public_ip
}

