# Generated by Django 5.1.4 on 2025-01-29 16:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mcoop_app', '0003_rename_co_date_member_birth_date1_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='loan',
            name='control_number',
            field=models.CharField(default='16258', max_length=5, primary_key=True, serialize=False),
        ),
    ]
