# Schedule definitions (times in UTC)
# Romania is UTC+2 (winter) / UTC+3 (summer)
locals {
  schedules = {
    morning = {
      cron        = "cron(0 5 * * ? *)" # 5:00 UTC = 7am winter / 8am summer Romania
      description = "Morning forecast update"
    }
    afternoon = {
      cron        = "cron(0 12 * * ? *)" # 12:00 UTC = 2pm winter / 3pm summer Romania
      description = "Afternoon forecast update"
    }
    evening = {
      cron        = "cron(0 18 * * ? *)" # 18:00 UTC = 8pm winter / 9pm summer Romania
      description = "Evening forecast update"
    }
  }
}

# EventBridge rules for each schedule
resource "aws_cloudwatch_event_rule" "forecast_schedule" {
  for_each = local.schedules

  name                = "${var.lambda_function_name}-${each.key}"
  description         = each.value.description
  schedule_expression = each.value.cron

  tags = {
    Name     = "Weather Forecast - ${each.key}"
    Schedule = each.key
  }
}

# EventBridge targets - Lambda function for each schedule
resource "aws_cloudwatch_event_target" "lambda_target" {
  for_each = local.schedules

  rule      = aws_cloudwatch_event_rule.forecast_schedule[each.key].name
  target_id = "WeatherForecastLambda-${each.key}"
  arn       = aws_lambda_function.weather_forecast.arn

  # Input to pass to Lambda with schedule context
  input = jsonencode({
    source    = "scheduled"
    triggered = "eventbridge"
    schedule  = each.key
  })
}

# Permissions for EventBridge to invoke Lambda (one per schedule)
resource "aws_lambda_permission" "allow_eventbridge" {
  for_each = local.schedules

  statement_id  = "AllowExecutionFromEventBridge-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.weather_forecast.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.forecast_schedule[each.key].arn
}
