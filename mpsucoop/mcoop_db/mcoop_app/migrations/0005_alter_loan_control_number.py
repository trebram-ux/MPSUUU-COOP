# Generated by Django 5.1.4 on 2025-01-29 16:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mcoop_app', '0004_alter_loan_control_number'),
    ]

    operations = [
        migrations.AlterField(
            model_name='loan',
            name='control_number',
            field=models.CharField(default='a1fd9', max_length=5, primary_key=True, serialize=False),
        ),
    ]
