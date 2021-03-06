# frozen_string_literal: true

# Representation of a payload of an alert. Defines a constant
# API so that payloads from various sources can be treated
# identically. Subclasses should define how to parse payload
# based on source of alert.
module Gitlab
  module AlertManagement
    module Payload
      class Base
        include ActiveModel::Model
        include Gitlab::Utils::StrongMemoize
        include Gitlab::Routing

        attr_accessor :project, :payload

        # Any attribute expected to be specifically read from
        # or derived from an alert payload should be defined.
        EXPECTED_PAYLOAD_ATTRIBUTES = [
          :alert_markdown,
          :alert_title,
          :annotations,
          :ends_at,
          :environment,
          :environment_name,
          :full_query,
          :generator_url,
          :gitlab_alert,
          :gitlab_fingerprint,
          :gitlab_prometheus_alert_id,
          :gitlab_y_label,
          :description,
          :hosts,
          :metric_id,
          :metrics_dashboard_url,
          :monitoring_tool,
          :runbook,
          :service,
          :severity,
          :starts_at,
          :status,
          :title
        ].freeze

        # Define expected API for a payload
        EXPECTED_PAYLOAD_ATTRIBUTES.each do |key|
          define_method(key) {}
        end

        # Defines a method which allows access to a given
        # value within an alert payload
        #
        # @param key [Symbol] Name expected to be used to reference value
        # @param paths [String, Array<String>, Array<Array<String>>,]
        #              List of (nested) keys at value can be found, the
        #              first to yield a result will be used
        # @param type [Symbol] If value should be converted to another type,
        #              that should be specified here
        # @param fallback [Proc] Block to be executed to yield a value if
        #                 a value cannot be idenitied at any provided paths
        # Example)
        #    attribute :title
        #              paths: [['title'],
        #                     ['details', 'title']]
        #              fallback: Proc.new { 'New Alert' }
        #
        # The above sample definition will define a method
        # called #title which will return the value from the
        # payload under the key `title` if available, otherwise
        # looking under `details.title`. If neither returns a
        # value, the return value will be `'New Alert'`
        def self.attribute(key, paths:, type: nil, fallback: -> { nil })
          define_method(key) do
            strong_memoize(key) do
              paths = Array(paths).first.is_a?(String) ? [Array(paths)] : paths
              value = value_for_paths(paths)
              value = parse_value(value, type) if value

              value.presence || fallback.call
            end
          end
        end

        # Attributes of an AlertManagement::Alert as read
        # directly from a payload. Prefer accessing
        # AlertManagement::Alert directly for read operations.
        def alert_params
          {
            description: description,
            ended_at: ends_at,
            environment: environment,
            fingerprint: gitlab_fingerprint,
            hosts: Array(hosts),
            monitoring_tool: monitoring_tool,
            payload: payload,
            project_id: project.id,
            prometheus_alert: gitlab_alert,
            service: service,
            severity: severity,
            started_at: starts_at,
            title: title
          }.transform_values(&:presence).compact
        end

        def gitlab_fingerprint
          strong_memoize(:gitlab_fingerprint) do
            next unless plain_gitlab_fingerprint

            Gitlab::AlertManagement::Fingerprint.generate(plain_gitlab_fingerprint)
          end
        end

        def environment
          strong_memoize(:environment) do
            next unless environment_name

            EnvironmentsFinder
              .new(project, nil, { name: environment_name })
              .find
              .first
          end
        end

        private

        def plain_gitlab_fingerprint; end

        def value_for_paths(paths)
          target_path = paths.find { |path| payload&.dig(*path) }

          payload&.dig(*target_path) if target_path
        end

        def parse_value(value, type)
          case type
          when :time
            parse_time(value)
          when :integer
            parse_integer(value)
          else
            value
          end
        end

        def parse_time(value)
          Time.parse(value).utc
        rescue ArgumentError
        end

        def parse_integer(value)
          Integer(value)
        rescue ArgumentError, TypeError
        end
      end
    end
  end
end
