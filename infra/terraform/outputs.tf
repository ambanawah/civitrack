output "server_ip" {
  description = "Public IP of the CiviTrack server"
  value       = digitalocean_droplet.civitrack_server.ipv4_address
}

output "gateway_url" {
  description = "CiviTrack API Gateway URL"
  value       = "http://${digitalocean_droplet.civitrack_server.ipv4_address}:3000"
}

output "jenkins_url" {
  description = "Jenkins CI/CD URL"
  value       = "http://${digitalocean_droplet.civitrack_server.ipv4_address}:8080"
}

output "grafana_url" {
  description = "Grafana monitoring dashboard"
  value       = "http://${digitalocean_droplet.civitrack_server.ipv4_address}:3003"
}

output "health_check_url" {
  description = "System health endpoint"
  value       = "http://${digitalocean_droplet.civitrack_server.ipv4_address}:3000/health"
}

output "ssh_command" {
  description = "SSH into the server"
  value       = "ssh root@${digitalocean_droplet.civitrack_server.ipv4_address}"
}
