# frozen_string_literal: true

module QA
  RSpec.describe 'Create' do
    context 'Gitaly' do
      describe 'Backend node recovery', :orchestrated, :gitaly_cluster, :skip_live_env do
        let(:praefect_manager) { Service::PraefectManager.new }
        let(:project) do
          Resource::Project.fabricate! do |project|
            project.name = "gitaly_cluster"
            project.initialize_with_readme = true
          end
        end

        before do
          # Reset the cluster in case previous tests left it in a bad state
          praefect_manager.reset_primary_to_original
        end

        after do
          # Leave the cluster in a suitable state for subsequent tests
          praefect_manager.reset_primary_to_original
        end

        it 'recovers from dataloss', quarantine: { issue: 'https://gitlab.com/gitlab-org/gitlab/-/issues/238186', type: :investigating } do
          # Create a new project with a commit and wait for it to replicate
          praefect_manager.wait_for_replication(project.id)

          # Stop the primary node to trigger failover, and then wait
          # for Gitaly to be ready for writes again
          praefect_manager.trigger_failover_by_stopping_primary_node
          praefect_manager.wait_for_new_primary
          praefect_manager.wait_for_health_check_current_primary_node
          praefect_manager.wait_for_gitaly_check

          # Confirm that we have access to the repo after failover
          Support::Waiter.wait_until(retry_on_exception: true, sleep_interval: 5) do
            Resource::Repository::Commit.fabricate_via_api! do |commits|
              commits.project = project
              commits.sha = 'master'
            end
          end

          # Push a commit to the new primary
          Resource::Repository::ProjectPush.fabricate! do |push|
            push.project = project
            push.new_branch = false
            push.commit_message = 'pushed after failover'
            push.file_name = 'new_file'
            push.file_content = 'new file'
          end

          # Start the old primary node again
          praefect_manager.start_primary_node
          praefect_manager.wait_for_health_check_current_primary_node

          # Confirm dataloss (i.e., inconsistent nodes)
          expect(praefect_manager.replicated?(project.id)).to be false

          # Reconcile nodes to recover from dataloss
          praefect_manager.reconcile_nodes
          praefect_manager.wait_for_replication(project.id)

          # Confirm that both commits are available after reconciliation
          expect(project.commits.map { |commit| commit[:message].chomp })
            .to include("Initial commit").and include("pushed after failover")
        end
      end
    end
  end
end
